package com.guardian.safety.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import com.guardian.safety.ui.theme.*

@Composable
fun EnhancedSOSButton(
    onEmergencyTrigger: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier,
    size: String = "lg",
    countdown: Int = 3
) {
    var isPressed by remember { mutableStateOf(false) }
    var currentCountdown by remember { mutableStateOf(0) }
    var isTriggering by remember { mutableStateOf(false) }
    
    val sizeClasses = mapOf(
        "sm" to 80.dp,
        "md" to 112.dp,
        "lg" to 144.dp
    )
    
    val iconSizes = mapOf(
        "sm" to 24.dp,
        "md" to 32.dp,
        "lg" to 40.dp
    )
    
    val buttonSize = sizeClasses[size] ?: 144.dp
    val iconSize = iconSizes[size] ?: 40.dp
    
    // Pulse animation matching web app
    val infiniteTransition = rememberInfiniteTransition(label = "SOS Pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        ),
        label = "Pulse Scale"
    )
    
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "Glow Alpha"
    )
    
    // Press scale animation
    val interactionSource = remember { MutableInteractionSource() }
    val buttonPressed by interactionSource.collectIsPressedAsState()
    val pressScale by animateFloatAsState(
        targetValue = if (buttonPressed) 0.95f else 1f,
        animationSpec = tween(100),
        label = "Press Scale"
    )
    
    // Progress for countdown
    val progress = if (currentCountdown > 0) {
        (countdown - currentCountdown + 1f) / countdown.toFloat()
    } else 0f
    
    val progressAnimated by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(100),
        label = "Progress"
    )
    
    // Handle press logic
    val handlePress = {
        if (!isPressed && !isTriggering) {
            isPressed = true
            currentCountdown = countdown
        }
    }
    
    val handleRelease = {
        isPressed = false
        currentCountdown = 0
    }
    
    // Countdown effect
    LaunchedEffect(isPressed, currentCountdown) {
        if (isPressed && currentCountdown > 0) {
            delay(1000)
            if (currentCountdown == 1) {
                // Trigger SOS
                isTriggering = true
                val alertId = "alert_${System.currentTimeMillis()}"
                onEmergencyTrigger?.invoke(alertId)
                
                delay(2000) // Show success state
                isTriggering = false
                isPressed = false
                currentCountdown = 0
            } else {
                currentCountdown--
            }
        }
    }
    
    Box(
        modifier = modifier
            .size(buttonSize)
            .scale(pulseScale * pressScale),
        contentAlignment = Alignment.Center
    ) {
        // Multiple glow layers matching web app
        repeat(4) { index ->
            val layerScale = 1f + (index * 0.1f)
            val layerAlpha = glowAlpha / (index + 1f)
            
            Box(
                modifier = Modifier
                    .size(buttonSize * layerScale)
                    .scale(if (isPressed) 1.2f else 1f)
                    .background(
                        when {
                            isTriggering -> GuardianGreen.copy(alpha = layerAlpha)
                            isPressed -> GuardianYellow.copy(alpha = layerAlpha)
                            else -> GuardianRed.copy(alpha = layerAlpha)
                        },
                        CircleShape
                    )
            )
        }
        
        // Main button
        Button(
            onClick = handlePress,
            modifier = Modifier.size(buttonSize * 0.8f),
            colors = ButtonDefaults.buttonColors(
                containerColor = when {
                    isTriggering -> GuardianGreen
                    isPressed -> GuardianYellow
                    else -> GuardianRed
                }
            ),
            shape = CircleShape,
            contentPadding = PaddingValues(0.dp),
            interactionSource = interactionSource
        ) {
            Box(contentAlignment = Alignment.Center) {
                // Progress indicator for countdown
                if (isPressed && currentCountdown > 0) {
                    CircularProgressIndicator(
                        progress = progressAnimated,
                        modifier = Modifier.size(buttonSize * 0.9f),
                        color = GuardianWhite,
                        strokeWidth = 4.dp
                    )
                }
                
                // Icon and text
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    when {
                        isTriggering -> {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = "Alert Sent",
                                tint = GuardianWhite,
                                modifier = Modifier.size(iconSize)
                            )
                            Text(
                                text = "SENT",
                                fontSize = (iconSize.value / 3).sp,
                                fontWeight = FontWeight.Bold,
                                color = GuardianWhite
                            )
                        }
                        isPressed -> {
                            Text(
                                text = currentCountdown.toString(),
                                fontSize = (iconSize.value / 1.5).sp,
                                fontWeight = FontWeight.Bold,
                                color = GuardianWhite
                            )
                            Text(
                                text = "RELEASE TO CANCEL",
                                fontSize = (iconSize.value / 5).sp,
                                fontWeight = FontWeight.Bold,
                                color = GuardianWhite
                            )
                        }
                        else -> {
                            Icon(
                                imageVector = Icons.Default.ReportProblem,
                                contentDescription = "SOS",
                                tint = GuardianWhite,
                                modifier = Modifier.size(iconSize)
                            )
                            Text(
                                text = "SOS",
                                fontSize = (iconSize.value / 3).sp,
                                fontWeight = FontWeight.Bold,
                                color = GuardianWhite
                            )
                        }
                    }
                }
            }
        }
        
        // Release gesture handling
        LaunchedEffect(buttonPressed) {
            if (!buttonPressed && isPressed && !isTriggering) {
                handleRelease()
            }
        }
    }
}
