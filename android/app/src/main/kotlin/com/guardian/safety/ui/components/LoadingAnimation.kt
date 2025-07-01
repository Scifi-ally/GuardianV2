package com.guardian.safety.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.guardian.safety.ui.theme.GuardianWhite

@Composable
fun LoadingAnimation(
    modifier: Modifier = Modifier,
    size: String = "md",
    color: Color = GuardianWhite
) {
    val dotSize = when (size) {
        "sm" -> 4.dp
        "md" -> 6.dp
        "lg" -> 8.dp
        else -> 6.dp
    }
    
    val animationDelay = 150
    
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(3) { index ->
            val infiniteTransition = rememberInfiniteTransition(
                label = "LoadingDot$index"
            )
            
            val scale by infiniteTransition.animateFloat(
                initialValue = 0.3f,
                targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(
                        durationMillis = 600,
                        delayMillis = index * animationDelay
                    ),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "DotScale$index"
            )
            
            Box(
                modifier = Modifier
                    .size(dotSize)
                    .scale(scale)
                    .background(
                        color = color,
                        shape = CircleShape
                    )
            )
            
            if (index < 2) {
                Spacer(modifier = Modifier.width(dotSize / 2))
            }
        }
    }
}

@Composable
fun FullPageLoading(
    text: String = "Loading..."
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            LoadingAnimation(
                size = "lg",
                color = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            androidx.compose.material3.Text(
                text = text,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onBackground
            )
        }
    }
}
