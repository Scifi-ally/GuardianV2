package com.guardian.safety.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.guardian.safety.ui.theme.*

@Composable
fun ErrorBoundary(
    error: Throwable? = null,
    onRetry: (() -> Unit)? = null,
    onReset: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    if (error != null) {
        ErrorFallback(
            error = error,
            onRetry = onRetry,
            onReset = onReset,
            modifier = modifier
        )
    } else {
        content()
    }
}

@Composable
fun ErrorFallback(
    error: Throwable,
    onRetry: (() -> Unit)? = null,
    onReset: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = GuardianRed.copy(alpha = 0.1f)
        ),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            GuardianRed.copy(alpha = 0.3f)
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Error icon
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = "Error",
                tint = GuardianRed,
                modifier = Modifier.size(48.dp)
            )
            
            // Title
            Text(
                text = "Something went wrong",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = GuardianRed,
                textAlign = TextAlign.Center
            )
            
            // Error message
            Text(
                text = error.message ?: "An unexpected error occurred",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
            
            // Additional error info (for debug builds)
            if (error.cause != null) {
                Text(
                    text = "Cause: ${error.cause?.message}",
                    style = MaterialTheme.typography.bodySmall,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
            }
            
            // Actions
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (onRetry != null) {
                    OutlinedButton(
                        onClick = onRetry,
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = GuardianRed
                        ),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            GuardianRed
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Retry")
                    }
                }
                
                if (onReset != null) {
                    Button(
                        onClick = onReset,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = GuardianRed
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.RestartAlt,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Reset")
                    }
                }
            }
            
            // Help text
            Text(
                text = "If this problem persists, please contact support or try restarting the app.",
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
            )
        }
    }
}

// Profile-specific error boundary
@Composable
fun ProfileErrorBoundary(
    error: Throwable? = null,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    if (error != null) {
        Card(
            modifier = modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = GuardianRed.copy(alpha = 0.1f)
            ),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = "Error",
                        tint = GuardianRed,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "Profile Error",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = GuardianRed
                    )
                }
                
                Text(
                    text = "Unable to load profile information. Please check your connection and try again.",
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                
                if (onRetry != null) {
                    Button(
                        onClick = onRetry,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = GuardianRed
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Try Again")
                    }
                }
            }
        }
    } else {
        content()
    }
}

// Hook for error handling in composables
@Composable
fun rememberErrorHandler(): (Throwable) -> Unit {
    var currentError by remember { mutableStateOf<Throwable?>(null) }
    
    return { error ->
        currentError = error
        // Log error for debugging
        println("Error caught by ErrorBoundary: ${error.message}")
        error.printStackTrace()
    }
}

// Generic error state handler
class ErrorState(
    var error: Throwable? = null,
    var isLoading: Boolean = false,
    var hasError: Boolean = false
) {
    fun setError(throwable: Throwable) {
        error = throwable
        hasError = true
        isLoading = false
    }
    
    fun setLoading() {
        isLoading = true
        hasError = false
        error = null
    }
    
    fun setSuccess() {
        isLoading = false
        hasError = false
        error = null
    }
    
    fun clear() {
        error = null
        hasError = false
        isLoading = false
    }
}

@Composable
fun rememberErrorState(): ErrorState {
    return remember { ErrorState() }
}
