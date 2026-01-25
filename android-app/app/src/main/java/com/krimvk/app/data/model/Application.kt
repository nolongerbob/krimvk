package com.krimvk.app.data.model

import com.google.gson.annotations.SerializedName

data class ServiceApplication(
    @SerializedName("id")
    val id: String,

    @SerializedName("applicationNumber")
    val applicationNumber: String,

    @SerializedName("type")
    val type: String,

    @SerializedName("status")
    val status: ApplicationStatus,

    @SerializedName("description")
    val description: String,

    @SerializedName("createdAt")
    val createdAt: String,

    @SerializedName("updatedAt")
    val updatedAt: String
)

enum class ApplicationStatus {
    @SerializedName("NEW")
    NEW,

    @SerializedName("IN_PROGRESS")
    IN_PROGRESS,

    @SerializedName("COMPLETED")
    COMPLETED,

    @SerializedName("CANCELLED")
    CANCELLED
}

data class CreateApplicationRequest(
    @SerializedName("accountId")
    val accountId: String,

    @SerializedName("type")
    val type: String,

    @SerializedName("description")
    val description: String
)

data class ApplicationsResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("applications")
    val applications: List<ServiceApplication>? = null,

    @SerializedName("error")
    val error: String? = null
)
