package com.krimvk.app.data.model

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    @SerializedName("email")
    val email: String,

    @SerializedName("password")
    val password: String
)

data class LoginResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("token")
    val token: String? = null,

    @SerializedName("user")
    val user: User? = null,

    @SerializedName("error")
    val error: String? = null
)

data class RegisterRequest(
    @SerializedName("email")
    val email: String,

    @SerializedName("password")
    val password: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("phone")
    val phone: String
)

data class RegisterResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("emailSent")
    val emailSent: Boolean? = null,

    @SerializedName("userId")
    val userId: String? = null,

    @SerializedName("error")
    val error: String? = null
)

data class VerifyEmailRequest(
    @SerializedName("token")
    val token: String
)

data class ResendVerificationRequest(
    @SerializedName("email")
    val email: String
)

data class ChangePasswordRequest(
    @SerializedName("oldPassword")
    val oldPassword: String,

    @SerializedName("newPassword")
    val newPassword: String
)

data class GenericResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("message")
    val message: String? = null,

    @SerializedName("error")
    val error: String? = null
)
