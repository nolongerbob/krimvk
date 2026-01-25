package com.krimvk.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.krimvk.app.ui.screens.auth.LoginScreen
import com.krimvk.app.ui.screens.auth.RegisterScreen
import com.krimvk.app.ui.screens.dashboard.DashboardScreen
import com.krimvk.app.ui.screens.bills.BillsScreen
import com.krimvk.app.ui.screens.meters.MetersScreen
import com.krimvk.app.ui.screens.applications.ApplicationsScreen
import com.krimvk.app.ui.screens.support.SupportScreen
import com.krimvk.app.ui.screens.settings.SettingsScreen

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Dashboard : Screen("dashboard")
    object Bills : Screen("bills")
    object Meters : Screen("meters")
    object Applications : Screen("applications")
    object Support : Screen("support")
    object Settings : Screen("settings")
}

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(navController = navController)
        }

        composable(Screen.Register.route) {
            RegisterScreen(navController = navController)
        }

        composable(Screen.Dashboard.route) {
            DashboardScreen(navController = navController)
        }

        composable(Screen.Bills.route) {
            BillsScreen(navController = navController)
        }

        composable(Screen.Meters.route) {
            MetersScreen(navController = navController)
        }

        composable(Screen.Applications.route) {
            ApplicationsScreen(navController = navController)
        }

        composable(Screen.Support.route) {
            SupportScreen(navController = navController)
        }

        composable(Screen.Settings.route) {
            SettingsScreen(navController = navController)
        }
    }
}
