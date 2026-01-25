package com.krimvk.app.data.model

import com.google.gson.annotations.SerializedName

data class WaterAccount(
    @SerializedName("id")
    val id: String,

    @SerializedName("accountNumber")
    val accountNumber: String,

    @SerializedName("address")
    val address: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("phone")
    val phone: String?,

    @SerializedName("region")
    val region: String?,

    @SerializedName("isActive")
    val isActive: Boolean,

    @SerializedName("createdAt")
    val createdAt: String
)

data class AddAccountRequest(
    @SerializedName("accountNumber")
    val accountNumber: String,

    @SerializedName("password1c")
    val password1c: String,

    @SerializedName("region")
    val region: String
)

data class AccountsResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("accounts")
    val accounts: List<WaterAccount>? = null,

    @SerializedName("error")
    val error: String? = null
)
