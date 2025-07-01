package com.guardian.safety.data.auth

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.UserProfileChangeRequest
import com.google.firebase.firestore.FirebaseFirestore
import com.guardian.safety.data.model.UserProfile
import com.guardian.safety.data.model.EmergencyContact
import com.guardian.safety.services.EmergencyKeyService
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore,
    private val emergencyKeyService: EmergencyKeyService
) {
    
    val currentUser: Flow<FirebaseUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { auth ->
            trySend(auth.currentUser)
        }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    suspend fun signUp(email: String, password: String, name: String): Result<UserProfile> {
        return try {
            // Create user account
            val userCredential = auth.createUserWithEmailAndPassword(email, password).await()
            val user = userCredential.user ?: throw Exception("User creation failed")

            // Update display name
            val profileUpdates = UserProfileChangeRequest.Builder()
                .setDisplayName(name)
                .build()
            user.updateProfile(profileUpdates).await()

            // Generate Guardian key - matching web app logic
            val guardianKey = emergencyKeyService.createGuardianKey(
                user.uid,
                name,
                email
            )

            // Create user profile in Firestore - matching web app structure
            val userProfile = UserProfile(
                uid = user.uid,
                email = email,
                displayName = name,
                guardianKey = guardianKey,
                emergencyContacts = emptyList(),
                createdAt = Date(),
                lastActive = Date(),
                phone = null,
                location = null,
                bio = null,
                photoURL = null
            )

            firestore.collection("users")
                .document(user.uid)
                .set(userProfile)
                .await()

            Result.success(userProfile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signIn(email: String, password: String): Result<UserProfile> {
        return try {
            val userCredential = auth.signInWithEmailAndPassword(email, password).await()
            val user = userCredential.user ?: throw Exception("Sign in failed")
            
            val userProfile = loadUserProfile(user.uid)
            Result.success(userProfile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signOut() {
        auth.signOut()
    }

    suspend fun loadUserProfile(uid: String): UserProfile {
        return try {
            val document = firestore.collection("users").document(uid).get().await()
            if (document.exists()) {
                document.toObject(UserProfile::class.java) ?: createFallbackProfile(uid)
            } else {
                createFallbackProfile(uid)
            }
        } catch (e: Exception) {
            createFallbackProfile(uid)
        }
    }

    private suspend fun createFallbackProfile(uid: String): UserProfile {
        val currentUser = auth.currentUser
        val guardianKey = emergencyKeyService.createGuardianKey(
            uid,
            currentUser?.displayName ?: "Guardian User",
            currentUser?.email ?: ""
        )
        
        return UserProfile(
            uid = uid,
            email = currentUser?.email ?: "",
            displayName = currentUser?.displayName ?: "Guardian User",
            guardianKey = guardianKey,
            emergencyContacts = emptyList(),
            createdAt = Date(),
            lastActive = Date()
        )
    }

    suspend fun updateProfile(profile: UserProfile): Result<Unit> {
        return try {
            firestore.collection("users")
                .document(profile.uid)
                .set(profile)
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
