package com.guardian.safety.presentation.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.guardian.safety.ui.theme.GuardianRed

@Composable
fun SOSButton(
    isActive: Boolean,
    countdown: Int,
    onPress: () -> Unit,
    onCancel: () -> Unit,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (isActive) 1.1f else 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulse"
    )

    Box(
        modifier = modifier.size(200.dp),
        contentAlignment = Alignment.Center
    ) {
        // Pulse rings when active
        if (isActive) {
            repeat(3) { index ->
                Box(
                    modifier = Modifier
                        .size(200.dp)
                        .scale(pulseScale + (index * 0.2f))
                        .clip(CircleShape)
                        .background(
                            GuardianRed.copy(alpha = 0.2f - (index * 0.05f))
                        )
                )
            }
        }

        // Main SOS Button
        Button(
            onClick = if (isActive) onCancel else onPress,
            modifier = Modifier
                .size(160.dp)
                .scale(scale)
                .pointerInput(Unit) {
                    detectTapGestures(
                        onPress = {
                            if (!isActive) {
                                onPress()
                            }
                        }
                    )
                },
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isActive) GuardianRed.copy(alpha = 0.9f) else GuardianRed
            ),
            shape = CircleShape,
            elevation = ButtonDefaults.buttonElevation(
                defaultElevation = if (isActive) 12.dp else 8.dp
            )
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                if (isActive && countdown > 0) {
                    Text(
                        text = countdown.toString(),
                        fontSize = 48.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "seconds",
                        fontSize = 14.sp,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                } else if (isActive) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = "Sending SOS",
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                    Text(
                        text = "SENDING",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                } else {
                    Text(
                        text = "SOS",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "PRESS & HOLD",
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
            }
        }

        // Cancel instruction when active
        if (isActive) {
            Text(
                text = "Release to cancel",
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .offset(y = 40.dp),
                style = MaterialTheme.typography.bodyMedium,
                color = GuardianRed,
                fontWeight = FontWeight.Medium
            )
        }
    }
}
