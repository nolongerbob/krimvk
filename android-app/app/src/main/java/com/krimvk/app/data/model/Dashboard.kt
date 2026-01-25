package com.krimvk.app.data.model

import com.google.gson.annotations.SerializedName

data class DashboardStats(
    @SerializedName("unpaidBills")
    val unpaidBills: BillsStats,

    @SerializedName("meters")
    val meters: MetersStats,

    @SerializedName("applications")
    val applications: ApplicationsStats
)

data class BillsStats(
    @SerializedName("count")
    val count: Int,

    @SerializedName("totalAmount")
    val totalAmount: Double
)

data class MetersStats(
    @SerializedName("count")
    val count: Int
)

data class ApplicationsStats(
    @SerializedName("activeCount")
    val activeCount: Int
)

data class DashboardStatsResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("stats")
    val stats: DashboardStats? = null,

    @SerializedName("error")
    val error: String? = null
)

data class AccountData(
    @SerializedName("accountNumber")
    val accountNumber: String,

    @SerializedName("balance")
    val balance: Double,

    @SerializedName("currentCharges")
    val currentCharges: Double,

    @SerializedName("currentPayments")
    val currentPayments: Double,

    @SerializedName("address")
    val address: String,

    @SerializedName("subscriberName")
    val subscriberName: String
)
