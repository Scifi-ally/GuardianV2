package com.guardian.safety.data.routing

import android.content.Context
import com.google.android.gms.maps.model.LatLng
import com.google.firebase.firestore.FirebaseFirestore
import com.guardian.safety.data.model.RouteDirection
import com.guardian.safety.data.model.RouteStep
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.tasks.await
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton
import org.json.JSONObject

@Singleton
class RoutingRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val firestore: FirebaseFirestore
) {

    suspend fun getDirections(
        origin: LatLng,
        destination: LatLng,
        travelMode: String = "walking",
        avoidTolls: Boolean = false,
        avoidHighways: Boolean = false,
        preferWellLit: Boolean = true
    ): Result<RouteDirection> {
        return try {
            val apiKey = getGoogleMapsApiKey()
            if (apiKey.isEmpty()) {
                return Result.failure(Exception("Google Maps API key not found"))
            }

            val url = buildDirectionsUrl(
                origin, destination, travelMode,
                avoidTolls, avoidHighways, apiKey
            )

            val response = makeHttpRequest(url)
            val routeDirection = parseDirectionsResponse(response, preferWellLit)

            // Save route to Firebase for safety tracking
            saveRouteToFirebase(routeDirection)

            Result.success(routeDirection)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun buildDirectionsUrl(
        origin: LatLng,
        destination: LatLng,
        travelMode: String,
        avoidTolls: Boolean,
        avoidHighways: Boolean,
        apiKey: String
    ): String {
        val baseUrl = "https://maps.googleapis.com/maps/api/directions/json"
        val originStr = "${origin.latitude},${origin.longitude}"
        val destStr = "${destination.latitude},${destination.longitude}"

        var url = "$baseUrl?origin=$originStr&destination=$destStr&mode=$travelMode&key=$apiKey"

        val avoid = mutableListOf<String>()
        if (avoidTolls) avoid.add("tolls")
        if (avoidHighways) avoid.add("highways")

        if (avoid.isNotEmpty()) {
            url += "&avoid=${avoid.joinToString("|")}"
        }

        // Add safety preferences
        url += "&alternatives=true" // Get alternative routes for safety

        return url
    }

    private suspend fun makeHttpRequest(urlString: String): String {
        val url = URL(urlString)
        val connection = url.openConnection() as HttpURLConnection

        return try {
            connection.requestMethod = "GET"
            connection.connectTimeout = 10000
            connection.readTimeout = 10000

            val responseCode = connection.responseCode
            if (responseCode == HttpURLConnection.HTTP_OK) {
                val reader = InputStreamReader(connection.inputStream)
                reader.readText()
            } else {
                throw Exception("HTTP error: $responseCode")
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun parseDirectionsResponse(response: String, preferWellLit: Boolean): RouteDirection {
        val json = JSONObject(response)
        val routes = json.getJSONArray("routes")

        if (routes.length() == 0) {
            throw Exception("No routes found")
        }

        // Select the best route based on safety preferences
        val routeIndex = if (preferWellLit && routes.length() > 1) {
            selectSafestRoute(routes)
        } else {
            0
        }

        val route = routes.getJSONObject(routeIndex)
        val leg = route.getJSONArray("legs").getJSONObject(0)

        val steps = leg.getJSONArray("steps")
        val routeSteps = mutableListOf<RouteStep>()

        for (i in 0 until steps.length()) {
            val step = steps.getJSONObject(i)
            routeSteps.add(
                RouteStep(
                    instruction = step.getString("html_instructions").replace(Regex("<[^>]*>"), ""),
                    distance = step.getJSONObject("distance").getString("text"),
                    duration = step.getJSONObject("duration").getString("text"),
                    maneuver = step.optString("maneuver", ""),
                    startLocation = LatLng(
                        step.getJSONObject("start_location").getDouble("lat"),
                        step.getJSONObject("start_location").getDouble("lng")
                    ),
                    endLocation = LatLng(
                        step.getJSONObject("end_location").getDouble("lat"),
                        step.getJSONObject("end_location").getDouble("lng")
                    )
                )
            )
        }

        return RouteDirection(
            steps = routeSteps,
            totalDistance = leg.getJSONObject("distance").getString("text"),
            totalDuration = leg.getJSONObject("duration").getString("text"),
            startAddress = leg.getString("start_address"),
            endAddress = leg.getString("end_address"),
            isSafeRoute = preferWellLit,
            polylinePoints = extractPolylinePoints(route)
        )
    }

    private fun selectSafestRoute(routes: org.json.JSONArray): Int {
        // In a real implementation, this would analyze routes for:
        // - Well-lit areas
        // - Population density
        // - Crime statistics
        // - Time of day

        // For now, prefer the route with more waypoints (usually more populated)
        var safestIndex = 0
        var maxWaypoints = 0

        for (i in 0 until routes.length()) {
            val route = routes.getJSONObject(i)
            val leg = route.getJSONArray("legs").getJSONObject(0)
            val steps = leg.getJSONArray("steps")

            if (steps.length() > maxWaypoints) {
                maxWaypoints = steps.length()
                safestIndex = i
            }
        }

        return safestIndex
    }

    private fun extractPolylinePoints(route: org.json.JSONObject): List<LatLng> {
        val points = mutableListOf<LatLng>()

        try {
            val overviewPolyline = route.getJSONObject("overview_polyline")
            val encodedPoints = overviewPolyline.getString("points")
            points.addAll(decodePolyline(encodedPoints))
        } catch (e: Exception) {
            // Fallback to step-by-step points
            val leg = route.getJSONArray("legs").getJSONObject(0)
            val steps = leg.getJSONArray("steps")

            for (i in 0 until steps.length()) {
                val step = steps.getJSONObject(i)
                val startLoc = step.getJSONObject("start_location")
                points.add(LatLng(startLoc.getDouble("lat"), startLoc.getDouble("lng")))

                if (i == steps.length() - 1) {
                    val endLoc = step.getJSONObject("end_location")
                    points.add(LatLng(endLoc.getDouble("lat"), endLoc.getDouble("lng")))
                }
            }
        }

        return points
    }

    private fun decodePolyline(encoded: String): List<LatLng> {
        val poly = mutableListOf<LatLng>()
        var index = 0
        val len = encoded.length
        var lat = 0
        var lng = 0

        while (index < len) {
            var b: Int
            var shift = 0
            var result = 0
            do {
                b = encoded[index++].code - 63
                result = result or (b and 0x1f shl shift)
                shift += 5
            } while (b >= 0x20)
            val dlat = if (result and 1 != 0) (result shr 1).inv() else result shr 1
            lat += dlat

            shift = 0
            result = 0
            do {
                b = encoded[index++].code - 63
                result = result or (b and 0x1f shl shift)
                shift += 5
            } while (b >= 0x20)
            val dlng = if (result and 1 != 0) (result shr 1).inv() else result shr 1
            lng += dlng

            val p = LatLng(lat.toDouble() / 1E5, lng.toDouble() / 1E5)
            poly.add(p)
        }

        return poly
    }

    private suspend fun saveRouteToFirebase(route: RouteDirection) {
        try {
            firestore.collection("routes")
                .add(
                    mapOf(
                        "startAddress" to route.startAddress,
                        "endAddress" to route.endAddress,
                        "totalDistance" to route.totalDistance,
                        "totalDuration" to route.totalDuration,
                        "isSafeRoute" to route.isSafeRoute,
                        "timestamp" to com.google.firebase.Timestamp.now(),
                        "stepCount" to route.steps.size
                    )
                )
                .await()
        } catch (e: Exception) {
            // Non-critical error - just log it
            e.printStackTrace()
        }
    }

    private fun getGoogleMapsApiKey(): String {
        return "AIzaSyA41wHVKnsb1RNhcftpHS5qNwvYz59nXIE"
    }
}
