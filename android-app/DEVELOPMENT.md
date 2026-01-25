# Руководство по разработке

## Быстрый старт для разработчиков

### 1. Клонирование и запуск

```bash
# Перейдите в директорию Android приложения
cd android-app

# Установите executable права для gradlew (только на Mac/Linux)
chmod +x gradlew

# Синхронизируйте зависимости
./gradlew build

# Или откройте проект в Android Studio
# File -> Open -> выберите папку android-app
```

### 2. Настройка API endpoint

Измените URL в `app/build.gradle.kts`:

```kotlin
buildTypes {
    debug {
        // Для локальной разработки
        buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")
    }
}
```

### 3. Запуск backend сервера

Перед запуском приложения убедитесь, что backend запущен:

```bash
# В корневой директории проекта
npm install
npm run dev
```

### 4. Запуск приложения

#### Через Android Studio
1. Откройте проект в Android Studio
2. Подключите Android устройство или запустите эмулятор
3. Нажмите Run (зеленая кнопка play)

#### Через командную строку
```bash
./gradlew installDebug
adb shell am start -n com.krimvk.app/.MainActivity
```

## Архитектура приложения

### MVVM (Model-View-ViewModel)

```
┌─────────────────────────────────────────┐
│              View (Compose)              │
│  • LoginScreen                           │
│  • DashboardScreen                       │
│  • MetersScreen                          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│           ViewModel                      │
│  • AuthViewModel                         │
│  • State management                      │
│  • UI events handling                    │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│          Repository                      │
│  • AuthRepository                        │
│  • Business logic                        │
│  • Data coordination                     │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌────────────┐
│ API Service │  │   Local    │
│  (Retrofit) │  │ DataStore  │
└─────────────┘  └────────────┘
```

### Слои приложения

#### 1. Presentation Layer (UI)
- **Composables**: Декларативный UI с Jetpack Compose
- **ViewModels**: Управление состоянием UI и бизнес-логикой
- **Navigation**: Навигация между экранами

#### 2. Domain Layer
- **Models**: Data classes для представления данных
- **Use Cases**: Бизнес-логика (если нужно)

#### 3. Data Layer
- **Repositories**: Абстракция над источниками данных
- **API Service**: Сетевые запросы через Retrofit
- **Local Storage**: DataStore для токенов и настроек

## Dependency Injection с Hilt

### Модули

#### NetworkModule
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService
}
```

#### AppModule
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideTokenManager(@ApplicationContext context: Context): TokenManager
}
```

### Использование в ViewModel

```kotlin
@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel()
```

## State Management

### UiState Pattern

```kotlin
sealed class AuthUiState {
    object Initial : AuthUiState()
    object Loading : AuthUiState()
    object Success : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}
```

### StateFlow в ViewModel

```kotlin
private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Initial)
val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

fun login(email: String, password: String) {
    viewModelScope.launch {
        _uiState.value = AuthUiState.Loading
        // ... выполнение запроса
        _uiState.value = AuthUiState.Success
    }
}
```

### Сбор состояния в Composable

```kotlin
@Composable
fun LoginScreen(viewModel: AuthViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    when (uiState) {
        is AuthUiState.Loading -> CircularProgressIndicator()
        is AuthUiState.Success -> NavigateToDashboard()
        is AuthUiState.Error -> ShowError()
        else -> ShowLoginForm()
    }
}
```

## Работа с API

### Добавление нового endpoint

1. **Определите модель данных** в `data/model/`:
```kotlin
data class NewFeature(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String
)
```

2. **Добавьте endpoint в ApiService**:
```kotlin
@GET("/api/new-feature")
suspend fun getNewFeature(): Response<NewFeature>
```

3. **Создайте Repository метод**:
```kotlin
suspend fun getNewFeature(): Result<NewFeature> {
    return try {
        val response = apiService.getNewFeature()
        if (response.isSuccessful && response.body() != null) {
            Result.success(response.body()!!)
        } else {
            Result.failure(Exception(response.message()))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

4. **Используйте в ViewModel**:
```kotlin
fun loadNewFeature() {
    viewModelScope.launch {
        val result = repository.getNewFeature()
        // обработка результата
    }
}
```

## Добавление нового экрана

### 1. Создайте Screen класс в NavGraph.kt

```kotlin
sealed class Screen(val route: String) {
    object NewScreen : Screen("new_screen")
}
```

### 2. Создайте Composable функцию

```kotlin
// ui/screens/newscreen/NewScreen.kt
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewScreen(navController: NavController) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("New Screen") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Назад")
                    }
                }
            )
        }
    ) { padding ->
        // Содержимое экрана
    }
}
```

### 3. Добавьте в NavGraph

```kotlin
@Composable
fun NavGraph(navController: NavHostController, startDestination: String) {
    NavHost(navController = navController, startDestination = startDestination) {
        // ...
        composable(Screen.NewScreen.route) {
            NewScreen(navController = navController)
        }
    }
}
```

### 4. Навигация к экрану

```kotlin
Button(onClick = { navController.navigate(Screen.NewScreen.route) }) {
    Text("Go to New Screen")
}
```

## Лучшие практики

### Compose

#### 1. Разделение логики и UI
```kotlin
// Плохо
@Composable
fun MyScreen() {
    val data = remember { mutableStateOf<List<Item>>(emptyList()) }

    LaunchedEffect(Unit) {
        // Сетевой запрос напрямую в Composable
        data.value = fetchData()
    }
}

// Хорошо
@Composable
fun MyScreen(viewModel: MyViewModel = hiltViewModel()) {
    val data by viewModel.data.collectAsState()

    // Только UI логика
}
```

#### 2. Переиспользуемые компоненты
```kotlin
@Composable
fun MenuItem(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Card(onClick = onClick) {
        Row {
            Icon(icon, contentDescription = null)
            Text(title)
        }
    }
}
```

#### 3. Preview для разработки
```kotlin
@Preview(showBackground = true)
@Composable
fun MenuItemPreview() {
    KrimVKTheme {
        MenuItem(
            title = "Счета",
            icon = Icons.Default.Receipt,
            onClick = {}
        )
    }
}
```

### Coroutines

#### 1. Используйте viewModelScope
```kotlin
fun loadData() {
    viewModelScope.launch {
        // Автоматически отменяется при уничтожении ViewModel
        val data = repository.getData()
    }
}
```

#### 2. Обработка ошибок
```kotlin
viewModelScope.launch {
    try {
        val result = repository.getData()
        _uiState.value = UiState.Success(result)
    } catch (e: Exception) {
        _uiState.value = UiState.Error(e.message ?: "Unknown error")
    }
}
```

### Безопасность

#### 1. Не храните пароли в открытом виде
```kotlin
// Используйте только для передачи на сервер
data class LoginRequest(val email: String, val password: String)

// Никогда не сохраняйте пароль локально
```

#### 2. Безопасное хранение токенов
```kotlin
// DataStore автоматически шифрует данные
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    suspend fun saveToken(token: String) {
        context.dataStore.edit { it[TOKEN_KEY] = token }
    }
}
```

## Отладка

### Логирование

```kotlin
// Используйте Android Log
import android.util.Log

class MyClass {
    private val TAG = "MyClass"

    fun myMethod() {
        Log.d(TAG, "Debug message")
        Log.e(TAG, "Error message", exception)
    }
}
```

### Network Inspector

В Android Studio откройте: `View -> Tool Windows -> App Inspection`

### Debugging breakpoints

Установите breakpoints в ViewModel и Repository методах для отслеживания flow данных.

## Тестирование

### Unit тесты для ViewModel

```kotlin
@Test
fun `login with valid credentials should emit success state`() = runTest {
    // Given
    val viewModel = AuthViewModel(fakeRepository)

    // When
    viewModel.login("test@example.com", "password")

    // Then
    assertEquals(AuthUiState.Success, viewModel.uiState.value)
}
```

### UI тесты для Compose

```kotlin
@Test
fun loginButton_isDisabled_whenFieldsAreEmpty() {
    composeTestRule.setContent {
        LoginScreen()
    }

    composeTestRule
        .onNodeWithText("Войти")
        .assertIsNotEnabled()
}
```

## Полезные команды

```bash
# Очистка проекта
./gradlew clean

# Сборка debug
./gradlew assembleDebug

# Запуск тестов
./gradlew test

# Проверка кода (lint)
./gradlew lint

# Список задач
./gradlew tasks

# Зависимости
./gradlew dependencies
```

## Troubleshooting

### Ошибка компиляции после pull

```bash
./gradlew clean
File -> Invalidate Caches / Restart
```

### Hilt ошибки

Убедитесь что:
1. `@HiltAndroidApp` на Application классе
2. `@AndroidEntryPoint` на Activity
3. `@HiltViewModel` на ViewModel
4. kapt plugin добавлен в build.gradle.kts

### Compose ошибки

Проверьте версии в `app/build.gradle.kts`:
```kotlin
composeOptions {
    kotlinCompilerExtensionVersion = "1.5.4" // должна соответствовать Kotlin версии
}
```

## Ресурсы

- [Jetpack Compose Documentation](https://developer.android.com/jetpack/compose)
- [Kotlin Coroutines Guide](https://kotlinlang.org/docs/coroutines-guide.html)
- [Hilt Documentation](https://dagger.dev/hilt/)
- [Material Design 3](https://m3.material.io/)
- [Retrofit Documentation](https://square.github.io/retrofit/)
