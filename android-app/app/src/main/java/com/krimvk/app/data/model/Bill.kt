package com.krimvk.app.data.model

import com.google.gson.annotations.SerializedName

data class Bill(
    @SerializedName("id")
    val id: String,

    @SerializedName("accountId")
    val accountId: String,

    @SerializedName("billNumber")
    val billNumber: String,

    @SerializedName("amount")
    val amount: Double,

    @SerializedName("dueDate")
    val dueDate: String,

    @SerializedName("status")
    val status: BillStatus,

    @SerializedName("period")
    val period: String,

    @SerializedName("createdAt")
    val createdAt: String
)

enum class BillStatus {
    @SerializedName("UNPAID")
    UNPAID,

    @SerializedName("PAID")
    PAID,

    @SerializedName("OVERDUE")
    OVERDUE
}

data class BillsResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("bills")
    val bills: List<Bill>? = null,

    @SerializedName("error")
    val error: String? = null
)
