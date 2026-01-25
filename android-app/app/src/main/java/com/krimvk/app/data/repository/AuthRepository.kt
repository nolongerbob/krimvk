package com.krimvk.app.data.repository

import com.krimvk.app.data.api.ApiService
import com.krimvk.app.data.local.TokenManager
import com.krimvk.app.data.model.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) {
    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                if (loginResponse.success && loginResponse.token != null) {
                    tokenManager.saveToken(loginResponse.token)
                    loginResponse.user?.let { user ->
                        tokenManager.saveUserData(user.id, user.email, user.name)
                    }
                }
                Result.success(loginResponse)
            } else {
                Result.failure(Exception(response.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(
        email: String,
        password: String,
        name: String,
        phone: String
    ): Result<RegisterResponse> {
        return try {
            val response = apiService.register(
                RegisterRequest(email, password, name, phone)
            )
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        tokenManager.clearAll()
    }

    suspend fun isLoggedIn(): Boolean {
        return try {
            val response = apiService.checkAuth()
            response.isSuccessful && response.body()?.success == true
        } catch (e: Exception) {
            false
        }
    }
}
