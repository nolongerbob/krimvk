package com.krimvk.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.krimvk.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Initial)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            val result = authRepository.login(email, password)
            _uiState.value = if (result.isSuccess) {
                val response = result.getOrNull()
                if (response?.success == true) {
                    AuthUiState.Success
                } else {
                    AuthUiState.Error(response?.error ?: "Ошибка входа")
                }
            } else {
                AuthUiState.Error(result.exceptionOrNull()?.message ?: "Ошибка сети")
            }
        }
    }

    fun register(email: String, password: String, name: String, phone: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            val result = authRepository.register(email, password, name, phone)
            _uiState.value = if (result.isSuccess) {
                val response = result.getOrNull()
                if (response?.success == true) {
                    AuthUiState.RegisterSuccess(
                        emailSent = response.emailSent ?: false
                    )
                } else {
                    AuthUiState.Error(response?.error ?: "Ошибка регистрации")
                }
            } else {
                AuthUiState.Error(result.exceptionOrNull()?.message ?: "Ошибка сети")
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.value = AuthUiState.Initial
        }
    }

    fun resetState() {
        _uiState.value = AuthUiState.Initial
    }
}

sealed class AuthUiState {
    object Initial : AuthUiState()
    object Loading : AuthUiState()
    object Success : AuthUiState()
    data class RegisterSuccess(val emailSent: Boolean) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}
