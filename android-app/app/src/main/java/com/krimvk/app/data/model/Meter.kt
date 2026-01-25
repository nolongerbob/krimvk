package com.krimvk.app.data.model

import com.google.gson.annotations.SerializedName

data class WaterMeter(
    @SerializedName("id")
    val id: String,

    @SerializedName("serialNumber")
    val serialNumber: String,

    @SerializedName("address")
    val address: String,

    @SerializedName("type")
    val type: MeterType,

    @SerializedName("lastReading")
    val lastReading: Double?,

    @SerializedName("lastReadingDate")
    val lastReadingDate: String?,

    @SerializedName("installedAt")
    val installedAt: String
)

enum class MeterType {
    @SerializedName("HOT")
    HOT,

    @SerializedName("COLD")
    COLD
}

data class MeterReading(
    @SerializedName("id")
    val id: String,

    @SerializedName("meterId")
    val meterId: String,

    @SerializedName("reading")
    val reading: Double,

    @SerializedName("date")
    val date: String,

    @SerializedName("photoUrl")
    val photoUrl: String?,

    @SerializedName("verified")
    val verified: Boolean
)

data class SubmitMeterReadingRequest(
    @SerializedName("meterId")
    val meterId: String,

    @SerializedName("reading")
    val reading: Double,

    @SerializedName("photoBase64")
    val photoBase64: String? = null
)

data class MetersResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("meters")
    val meters: List<WaterMeter>? = null,

    @SerializedName("error")
    val error: String? = null
)

data class MeterReadingResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("reading")
    val reading: MeterReading? = null,

    @SerializedName("recognizedValue")
    val recognizedValue: Double? = null,

    @SerializedName("error")
    val error: String? = null
)

data class AddMeterRequest(
    @SerializedName("accountId")
    val accountId: String,

    @SerializedName("serialNumber")
    val serialNumber: String,

    @SerializedName("type")
    val type: String,

    @SerializedName("address")
    val address: String
)
