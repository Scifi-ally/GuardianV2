package com.guardian.safety.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.guardian.safety.ui.theme.*
import kotlinx.coroutines.delay

data class TutorialStep(
    val id: String,
    val title: String,
    val description: String,
    val icon: ImageVector,
    val type: String, // "info", "interactive", "practice", "completion"
    val completionCriteria: String
)

@Composable
fun InteractiveSafetyTutorial(
    isOpen: Boolean,
    onClose: () -> Unit,
    onComplete: () -> Unit
) {
    var currentStep by remember { mutableStateOf(0) }
    var completedSteps by remember { mutableStateOf(setOf<Int>()) }
    var isStepCompleted by remember { mutableStateOf(false) }
    
    val tutorialSteps = listOf(
        TutorialStep(
            id = "intro",
            title = "Welcome to Guardian",
            description = "Learn how to stay safe with Guardian's comprehensive safety features",
            icon = Icons.Default.Security,
            type = "info",
            completionCriteria = "Read introduction"
        ),
        TutorialStep(
            id = "guardian_key",
            title = "Guardian Key",
            description = "Your unique key connects you with trusted contacts",
            icon = Icons.Default.Key,
            type = "interactive",
            completionCriteria = "Copy your Guardian key"
        ),
        TutorialStep(
            id = "contacts",
            title = "Emergency Contacts",
            description = "Add trusted people who can help in emergencies",
            icon = Icons.Default.People,
            type = "practice",
            completionCriteria = "Add at least one emergency contact"
        ),
        TutorialStep(
            id = "sos_button",
            title = "SOS Button",
            description = "Learn how to trigger emergency alerts that could save your life",
            icon = Icons.Default.ReportProblem,
            type = "interactive",
            completionCriteria = "Practice the SOS button sequence"
        ),
        TutorialStep(
            id = "location",
            title = "Location Services",
            description = "Enable location services for accurate emergency response",
            icon = Icons.Default.LocationOn,
            type = "practice",
            completionCriteria = "Enable location permissions"
        ),
        TutorialStep(
            id = "completion",
            title = "You're Ready!",
            description = "Guardian is now set up to help keep you safe",
            icon = Icons.Default.CheckCircle,
            type = "completion",
            completionCriteria = "Complete tutorial"
        )
    )
    
    if (isOpen) {
        Dialog(
            onDismissRequest = onClose,
            properties = DialogProperties(
                dismissOnBackPress = true,
                dismissOnClickOutside = false,
                usePlatformDefaultWidth = false
            )
        ) {
            Card(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                shape = RoundedCornerShape(20.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp)
                ) {
                    // Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Guardian Safety Tutorial",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        
                        IconButton(onClick = onClose) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close",
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                    
                    // Progress
                    Column(
                        modifier = Modifier.padding(vertical = 16.dp)
                    ) {
                        LinearProgressIndicator(
                            progress = (currentStep + 1).toFloat() / tutorialSteps.size.toFloat(),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp)),
                            color = MaterialTheme.colorScheme.primary
                        )
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Text(
                            text = "Step ${currentStep + 1} of ${tutorialSteps.size}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                    
                    // Current Step Content
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                    ) {
                        when (tutorialSteps[currentStep].type) {
                            "info" -> InfoStep(tutorialSteps[currentStep]) { isStepCompleted = true }
                            "interactive" -> InteractiveStep(tutorialSteps[currentStep]) { isStepCompleted = true }
                            "practice" -> PracticeStep(tutorialSteps[currentStep]) { isStepCompleted = true }
                            "completion" -> CompletionStep(tutorialSteps[currentStep]) { onComplete() }
                        }
                    }
                    
                    // Navigation
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        // Back button
                        if (currentStep > 0) {
                            OutlinedButton(
                                onClick = { 
                                    currentStep--
                                    isStepCompleted = currentStep in completedSteps
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ArrowBack,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Back")
                            }
                        } else {
                            Spacer(modifier = Modifier.width(1.dp))
                        }
                        
                        // Next/Complete button
                        Button(
                            onClick = {
                                if (isStepCompleted) {
                                    completedSteps = completedSteps + currentStep
                                    if (currentStep < tutorialSteps.size - 1) {
                                        currentStep++
                                        isStepCompleted = currentStep in completedSteps
                                    } else {
                                        onComplete()
                                    }
                                }
                            },
                            enabled = isStepCompleted,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            )
                        ) {
                            Text(
                                if (currentStep < tutorialSteps.size - 1) "Next" else "Complete"
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(
                                imageVector = if (currentStep < tutorialSteps.size - 1) Icons.Default.ArrowForward else Icons.Default.Check,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun InfoStep(
    step: TutorialStep,
    onComplete: () -> Unit
) {
    LaunchedEffect(Unit) {
        delay(1000) // Auto-complete after 1 second
        onComplete()
    }
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
            ),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Icon(
                    imageVector = step.icon,
                    contentDescription = step.title,
                    modifier = Modifier.size(64.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                
                Text(
                    text = step.title,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                
                Text(
                    text = step.description,
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
        }
    }
}

@Composable
private fun InteractiveStep(
    step: TutorialStep,
    onComplete: () -> Unit
) {
    var demoCompleted by remember { mutableStateOf(false) }
    
    when (step.id) {
        "guardian_key" -> {
            GuardianKeyDemo(onComplete = {
                demoCompleted = true
                onComplete()
            })
        }
        "sos_button" -> {
            SOSButtonDemo(onComplete = {
                demoCompleted = true
                onComplete()
            })
        }
        else -> {
            InfoStep(step, onComplete)
        }
    }
}

@Composable
private fun PracticeStep(
    step: TutorialStep,
    onComplete: () -> Unit
) {
    // Auto-complete for demo purposes
    LaunchedEffect(Unit) {
        delay(2000)
        onComplete()
    }
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = step.icon,
            contentDescription = step.title,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = step.title,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = step.description,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        CircularProgressIndicator(
            color = MaterialTheme.colorScheme.primary
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "Setting up...",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
    }
}

@Composable
private fun CompletionStep(
    step: TutorialStep,
    onComplete: () -> Unit
) {
    LaunchedEffect(Unit) {
        delay(500)
        onComplete()
    }
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "🎉",
            fontSize = 64.sp
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            text = step.title,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = step.description,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Text(
            text = "You're now ready to use Guardian safely!",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "Remember to add emergency contacts and keep your location services enabled.",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
        )
    }
}

@Composable
private fun GuardianKeyDemo(onComplete: () -> Unit) {
    var keyRevealed by remember { mutableStateOf(false) }
    var copied by remember { mutableStateOf(false) }
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Text(
            text = "Your Guardian Key",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = if (keyRevealed) "ABC123XY" else "••••••••",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "Your unique Guardian Key",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
        }
        
        Text(
            text = "Share this key with trusted contacts so they can add you to their emergency network.",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center
        )
        
        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Button(
                onClick = { keyRevealed = !keyRevealed }
            ) {
                Icon(
                    imageVector = if (keyRevealed) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(if (keyRevealed) "Hide" else "Show")
            }
            
            Button(
                onClick = {
                    copied = true
                    onComplete()
                }
            ) {
                Icon(
                    imageVector = if (copied) Icons.Default.Check else Icons.Default.ContentCopy,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(if (copied) "Copied!" else "Copy")
            }
        }
    }
}

@Composable
private fun SOSButtonDemo(onComplete: () -> Unit) {
    var isPressed by remember { mutableStateOf(false) }
    var countdown by remember { mutableStateOf(0) }
    var demoCompleted by remember { mutableStateOf(false) }
    
    // Demo SOS button animation
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 1.1f else 1f,
        animationSpec = tween(100),
        label = "SOSScale"
    )
    
    LaunchedEffect(isPressed) {
        if (isPressed && countdown == 0) {
            countdown = 3
            while (countdown > 0) {
                delay(1000)
                countdown--
            }
            demoCompleted = true
            onComplete()
        }
    }
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Text(
            text = "Emergency SOS Button",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        
        Text(
            text = "In a real emergency, press and hold the SOS button for 3 seconds. This will alert all your emergency contacts with your location.",
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "Try the SOS button demo:",
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Medium
        )
        
        // Demo SOS Button
        Box(
            modifier = Modifier
                .size(120.dp)
                .scale(scale),
            contentAlignment = Alignment.Center
        ) {
            Button(
                onClick = { 
                    if (!isPressed && !demoCompleted) {
                        isPressed = true
                    }
                },
                modifier = Modifier.size(120.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (countdown > 0) GuardianYellow else GuardianRed
                ),
                shape = CircleShape
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    if (countdown > 0) {
                        Text(
                            text = countdown.toString(),
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.Bold,
                            color = GuardianWhite
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Default.ReportProblem,
                            contentDescription = "SOS",
                            tint = GuardianWhite,
                            modifier = Modifier.size(32.dp)
                        )
                        Text(
                            text = "SOS",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = GuardianWhite
                        )
                    }
                }
            }
        }
        
        Text(
            text = if (countdown > 0) {
                "Hold for $countdown more seconds..."
            } else if (demoCompleted) {
                "✓ Demo completed! You know how to use the SOS button."
            } else {
                "Press and hold the SOS button for 3 seconds"
            },
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            color = if (demoCompleted) GuardianGreen else MaterialTheme.colorScheme.onSurface
        )
    }
}
