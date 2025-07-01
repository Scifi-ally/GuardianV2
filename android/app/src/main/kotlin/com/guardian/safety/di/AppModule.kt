package com.guardian.safety.di

import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    // Firebase dependencies are now provided by FirebaseModule
    // Add other non-Firebase dependencies here if needed
}
