package com.krimvk.app.data.api

import com.krimvk.app.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth endpoints
    @POST("/api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("/api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<RegisterResponse>

    @GET("/api/auth/verify-email")
    suspend fun verifyEmail(@Query("token") token: String): Response<GenericResponse>

    @POST("/api/auth/resend-verification")
    suspend fun resendVerification(@Body request: ResendVerificationRequest): Response<GenericResponse>

    @GET("/api/auth/check")
    suspend fun checkAuth(): Response<GenericResponse>

    // User profile endpoints
    @GET("/api/user/profile")
    suspend fun getProfile(): Response<User>

    @PUT("/api/user/profile")
    suspend fun updateProfile(@Body user: User): Response<GenericResponse>

    @POST("/api/user/change-password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): Response<GenericResponse>

    // Accounts endpoints
    @GET("/api/accounts")
    suspend fun getAccounts(): Response<AccountsResponse>

    @POST("/api/accounts")
    suspend fun addAccount(@Body request: AddAccountRequest): Response<GenericResponse>

    @GET("/api/accounts/{id}/meters")
    suspend fun getAccountMeters(@Path("id") accountId: String): Response<MetersResponse>

    // Dashboard endpoints
    @GET("/api/dashboard/stats")
    suspend fun getDashboardStats(): Response<DashboardStatsResponse>

    // Bills endpoints
    @GET("/api/bills")
    suspend fun getBills(@Query("accountId") accountId: String? = null): Response<BillsResponse>

    // Meters endpoints
    @GET("/api/meters")
    suspend fun getMeters(@Query("accountId") accountId: String? = null): Response<MetersResponse>

    @POST("/api/meters")
    suspend fun addMeter(@Body request: AddMeterRequest): Response<GenericResponse>

    @POST("/api/meters/readings")
    suspend fun submitMeterReading(@Body request: SubmitMeterReadingRequest): Response<MeterReadingResponse>

    // Applications endpoints
    @GET("/api/applications")
    suspend fun getApplications(): Response<ApplicationsResponse>

    @POST("/api/applications/create")
    suspend fun createApplication(@Body request: CreateApplicationRequest): Response<GenericResponse>

    @POST("/api/applications/cancel")
    suspend fun cancelApplication(@Query("id") applicationId: String): Response<GenericResponse>

    // Questions/Support endpoints
    @GET("/api/questions")
    suspend fun getQuestions(): Response<QuestionsResponse>

    @POST("/api/questions/create")
    suspend fun createQuestion(@Body request: CreateQuestionRequest): Response<GenericResponse>

    @POST("/api/questions/send-message")
    suspend fun sendMessage(@Body request: SendMessageRequest): Response<GenericResponse>
}
