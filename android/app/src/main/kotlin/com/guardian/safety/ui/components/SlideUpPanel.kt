package com.guardian.safety.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import com.guardian.safety.ui.theme.*

@Composable
fun SlideUpPanel(
    modifier: Modifier = Modifier,
    children: @Composable () -> Unit,
    minHeight: Float = 200f,
    maxHeight: Float? = null,
    initialHeight: Float? = null,
    bottomOffset: Float = 96f,
    collapsedHeight: Float = 40f,
    onTouchOutside: (() -> Unit)? = null
) {
    val configuration = LocalConfiguration.current
    val screenHeight = configuration.screenHeightDp.toFloat()
    
    val actualMaxHeight = maxHeight ?: (screenHeight * 0.8f)
    val actualInitialHeight = initialHeight ?: (screenHeight * 0.45f)
    
    var height by remember { mutableStateOf(collapsedHeight) }
    var isDragging by remember { mutableStateOf(false) }
    var isCollapsed by remember { mutableStateOf(true) }
    
    val animatedHeight by animateFloatAsState(
        targetValue = height,
        animationSpec = if (isDragging) tween(0) else spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "panel_height"
    )
    
    val scope = rememberCoroutineScope()
    
    // Handle drag gestures
    val dragState = rememberDragGestureState(
        onDragStart = { isDragging = true },
        onDragEnd = { 
            isDragging = false
            
            // Snap to positions matching web app
            val snapThreshold = 50f
            val midHeight = (minHeight + actualMaxHeight) / 2f
            
            when {
                height < collapsedHeight + snapThreshold -> {
                    height = collapsedHeight
                    isCollapsed = true
                }
                height < minHeight + snapThreshold -> {
                    height = minHeight
                    isCollapsed = false
                }
                height > actualMaxHeight - snapThreshold -> {
                    height = actualMaxHeight
                    isCollapsed = false
                }
                kotlin.math.abs(height - midHeight) < snapThreshold -> {
                    height = midHeight
                    isCollapsed = false
                }
                else -> {
                    isCollapsed = false
                }
            }
        },
        onDrag = { deltaY ->
            val newHeight = (height - deltaY).coerceIn(collapsedHeight, actualMaxHeight)
            height = newHeight
            isCollapsed = newHeight <= collapsedHeight + 10f
        }
    )
    
    Card(
        modifier = modifier
            .fillMaxWidth()
            .height(animatedHeight.dp)
            .offset(y = (screenHeight - animatedHeight - bottomOffset).dp),
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.background.copy(alpha = 0.98f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 24.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Drag Handle - matching web app exactly
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(if (isCollapsed) 40.dp else 48.dp)
                    .clickable {
                        scope.launch {
                            if (isCollapsed) {
                                height = actualInitialHeight
                                isCollapsed = false
                            } else {
                                height = collapsedHeight
                                isCollapsed = true
                            }
                        }
                    }
                    .pointerInput(Unit) {
                        detectDragGestures(
                            onDragStart = { dragState.onDragStart() },
                            onDragEnd = { dragState.onDragEnd() },
                            onDrag = { _, dragAmount -> dragState.onDrag(dragAmount.y) }
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Handle bar
                    Box(
                        modifier = Modifier
                            .width(if (isDragging || isCollapsed) 64.dp else 48.dp)
                            .height(if (isDragging) 6.dp else 4.dp)
                            .background(
                                if (isDragging || isCollapsed) 
                                    MaterialTheme.colorScheme.onSurface 
                                else 
                                    MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                RoundedCornerShape(2.dp)
                            )
                    )
                    
                    if (isCollapsed) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Tap to expand",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            modifier = Modifier.animateContentSize()
                        )
                    }
                }
            }
            
            // Panel Content - matching web app behavior
            if (!isCollapsed) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .padding(horizontal = 24.dp, vertical = 0.dp)
                ) {
                    children()
                }
                
                // Bottom padding
                Spacer(modifier = Modifier.height(32.dp))
            }
            
            // Resize Indicator (debug mode)
            if (isDragging) {
                Box(
                    modifier = Modifier
                        .align(Alignment.End)
                        .padding(16.dp)
                        .background(
                            MaterialTheme.colorScheme.surface.copy(alpha = 0.8f),
                            RoundedCornerShape(4.dp)
                        )
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "${height.toInt()}dp",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}

// Helper class for drag gesture state
class DragGestureState(
    val onDragStart: () -> Unit,
    val onDragEnd: () -> Unit,
    val onDrag: (Float) -> Unit
)

@Composable
fun rememberDragGestureState(
    onDragStart: () -> Unit,
    onDragEnd: () -> Unit,
    onDrag: (Float) -> Unit
): DragGestureState {
    return remember {
        DragGestureState(onDragStart, onDragEnd, onDrag)
    }
}
