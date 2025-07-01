package com.guardian.safety.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = GuardianBlack, // Black primary to match web app
    secondary = GuardianGreen,
    tertiary = GuardianRed,
    background = GuardianDark,
    surface = GuardianDarkSurface,
    error = GuardianRed,
    onPrimary = GuardianWhite,
    onSecondary = GuardianWhite,
    onTertiary = GuardianWhite,
    onBackground = GuardianGray100,
    onSurface = GuardianGray100,
    onError = GuardianWhite
)

private val LightColorScheme = lightColorScheme(
    primary = GuardianBlack, // Black primary to match web app exactly
    secondary = GuardianGreen,
    tertiary = GuardianRed,
    background = GuardianWhite,
    surface = GuardianGray50,
    error = GuardianRed,
    onPrimary = GuardianWhite,
    onSecondary = GuardianWhite,
    onTertiary = GuardianWhite,
    onBackground = GuardianDark,
    onSurface = GuardianDark,
    onError = GuardianWhite
)

@Composable
fun GuardianTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color disabled to use custom purple theme matching web app
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
