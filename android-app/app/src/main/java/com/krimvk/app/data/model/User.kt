package com.krimvk.app.data.model

import com.google.gson.annotations.SerializedName

data class User(
    @SerializedName("id")
    val id: String,

    @SerializedName("email")
    val email: String,

    @SerializedName("name")
    val name: String?,

    @SerializedName("phone")
    val phone: String?,

    @SerializedName("role")
    val role: UserRole,

    @SerializedName("emailVerified")
    val emailVerified: String?
)

enum class UserRole {
    @SerializedName("USER")
    USER,

    @SerializedName("ADMIN")
    ADMIN
}
