package com.guardian.safety

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class GuardianApplication : Application() {

    companion object {
        const val SOS_CHANNEL_ID = "sos_channel"
        const val GENERAL_CHANNEL_ID = "general_channel"
        const val LOCATION_CHANNEL_ID = "location_channel"
    }
}
