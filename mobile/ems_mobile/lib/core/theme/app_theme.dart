import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  AppTheme._();

  static const _seedColor = Color(0xFF1A73E8);

  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: _seedColor,
      brightness: Brightness.light,
    );

    final textTheme = GoogleFonts.robotoTextTheme().copyWith(
      displayLarge: GoogleFonts.roboto(
          fontSize: 57, fontWeight: FontWeight.w400, letterSpacing: -0.25),
      displayMedium: GoogleFonts.roboto(
          fontSize: 45, fontWeight: FontWeight.w400),
      displaySmall: GoogleFonts.roboto(
          fontSize: 36, fontWeight: FontWeight.w400),
      headlineLarge: GoogleFonts.roboto(
          fontSize: 32, fontWeight: FontWeight.w400),
      headlineMedium: GoogleFonts.roboto(
          fontSize: 28, fontWeight: FontWeight.w400),
      headlineSmall: GoogleFonts.roboto(
          fontSize: 24, fontWeight: FontWeight.w400),
      titleLarge: GoogleFonts.roboto(
          fontSize: 22, fontWeight: FontWeight.w500),
      titleMedium: GoogleFonts.roboto(
          fontSize: 16, fontWeight: FontWeight.w500, letterSpacing: 0.15),
      titleSmall: GoogleFonts.roboto(
          fontSize: 14, fontWeight: FontWeight.w500, letterSpacing: 0.1),
      bodyLarge: GoogleFonts.roboto(
          fontSize: 16, fontWeight: FontWeight.w400, letterSpacing: 0.5),
      bodyMedium: GoogleFonts.roboto(
          fontSize: 14, fontWeight: FontWeight.w400, letterSpacing: 0.25),
      bodySmall: GoogleFonts.roboto(
          fontSize: 12, fontWeight: FontWeight.w400, letterSpacing: 0.4),
      labelLarge: GoogleFonts.roboto(
          fontSize: 14, fontWeight: FontWeight.w500, letterSpacing: 0.1),
      labelMedium: GoogleFonts.roboto(
          fontSize: 12, fontWeight: FontWeight.w500, letterSpacing: 0.5),
      labelSmall: GoogleFonts.roboto(
          fontSize: 11, fontWeight: FontWeight.w500, letterSpacing: 0.5),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: textTheme,

      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        backgroundColor: colorScheme.surface,
        foregroundColor: colorScheme.onSurface,
        titleTextStyle: GoogleFonts.roboto(
          fontSize: 22,
          fontWeight: FontWeight.w400,
          color: colorScheme.onSurface,
        ),
      ),

      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: colorScheme.outlineVariant.withOpacity(0.5)),
        ),
        clipBehavior: Clip.antiAlias,
        margin: EdgeInsets.zero,
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surfaceContainerHighest.withOpacity(0.4),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide(color: colorScheme.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide(color: colorScheme.error),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        prefixIconColor: colorScheme.onSurfaceVariant,
      ),

      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(26),
          ),
          textStyle: GoogleFonts.roboto(
              fontSize: 15, fontWeight: FontWeight.w500, letterSpacing: 0.1),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 44),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          side: BorderSide(color: colorScheme.outline),
          textStyle: GoogleFonts.roboto(
              fontSize: 14, fontWeight: FontWeight.w500, letterSpacing: 0.1),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          textStyle: GoogleFonts.roboto(
              fontSize: 14, fontWeight: FontWeight.w500, letterSpacing: 0.1),
        ),
      ),

      floatingActionButtonTheme: FloatingActionButtonThemeData(
        elevation: 3,
        highlightElevation: 4,
        backgroundColor: colorScheme.primaryContainer,
        foregroundColor: colorScheme.onPrimaryContainer,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),

      navigationBarTheme: NavigationBarThemeData(
        elevation: 0,
        height: 80,
        indicatorColor: colorScheme.secondaryContainer,
        backgroundColor: colorScheme.surfaceContainerLow,
        surfaceTintColor: Colors.transparent,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return IconThemeData(color: colorScheme.onSecondaryContainer, size: 24);
          }
          return IconThemeData(color: colorScheme.onSurfaceVariant, size: 24);
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.roboto(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: colorScheme.onSurface,
            );
          }
          return GoogleFonts.roboto(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: colorScheme.onSurfaceVariant,
          );
        }),
      ),

      dividerTheme: DividerThemeData(
        color: colorScheme.outlineVariant.withOpacity(0.4),
        thickness: 1,
        space: 1,
      ),

      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        minVerticalPadding: 8,
      ),

      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        side: BorderSide(color: colorScheme.outlineVariant),
      ),

      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),

      bottomSheetTheme: BottomSheetThemeData(
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        showDragHandle: true,
        dragHandleColor: colorScheme.onSurfaceVariant.withOpacity(0.4),
      ),

      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
      ),

      switchTheme: SwitchThemeData(
        thumbIcon: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const Icon(Icons.check, size: 16);
          }
          return null;
        }),
      ),

      searchBarTheme: SearchBarThemeData(
        elevation: WidgetStateProperty.all(0),
        backgroundColor:
            WidgetStateProperty.all(colorScheme.surfaceContainerHighest),
        shape: WidgetStateProperty.all(
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        ),
        padding: WidgetStateProperty.all(
            const EdgeInsets.symmetric(horizontal: 16)),
      ),
    );
  }

  static ThemeData dark() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: _seedColor,
      brightness: Brightness.dark,
    );

    final textTheme = GoogleFonts.robotoTextTheme(
      ThemeData(brightness: Brightness.dark).textTheme,
    ).copyWith(
      titleMedium: GoogleFonts.roboto(
          fontSize: 16, fontWeight: FontWeight.w500, letterSpacing: 0.15),
      bodyLarge: GoogleFonts.roboto(
          fontSize: 16, fontWeight: FontWeight.w400, letterSpacing: 0.5),
      bodyMedium: GoogleFonts.roboto(
          fontSize: 14, fontWeight: FontWeight.w400, letterSpacing: 0.25),
      bodySmall: GoogleFonts.roboto(
          fontSize: 12, fontWeight: FontWeight.w400, letterSpacing: 0.4),
      labelLarge: GoogleFonts.roboto(
          fontSize: 14, fontWeight: FontWeight.w500, letterSpacing: 0.1),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: textTheme,

      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        backgroundColor: colorScheme.surface,
        foregroundColor: colorScheme.onSurface,
        titleTextStyle: GoogleFonts.roboto(
          fontSize: 22,
          fontWeight: FontWeight.w400,
          color: colorScheme.onSurface,
        ),
      ),

      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: colorScheme.outlineVariant.withOpacity(0.3)),
        ),
        clipBehavior: Clip.antiAlias,
        margin: EdgeInsets.zero,
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surfaceContainerHighest.withOpacity(0.4),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(28),
          borderSide: BorderSide(color: colorScheme.primary, width: 2),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        prefixIconColor: colorScheme.onSurfaceVariant,
      ),

      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(26),
          ),
          textStyle: GoogleFonts.roboto(
              fontSize: 15, fontWeight: FontWeight.w500, letterSpacing: 0.1),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 44),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
          ),
          side: BorderSide(color: colorScheme.outline),
        ),
      ),

      floatingActionButtonTheme: FloatingActionButtonThemeData(
        elevation: 3,
        backgroundColor: colorScheme.primaryContainer,
        foregroundColor: colorScheme.onPrimaryContainer,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),

      navigationBarTheme: NavigationBarThemeData(
        elevation: 0,
        height: 80,
        indicatorColor: colorScheme.secondaryContainer,
        backgroundColor: colorScheme.surfaceContainerLow,
        surfaceTintColor: Colors.transparent,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      ),

      dividerTheme: DividerThemeData(
        color: colorScheme.outlineVariant.withOpacity(0.3),
        thickness: 1,
        space: 1,
      ),

      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        minVerticalPadding: 8,
      ),

      bottomSheetTheme: BottomSheetThemeData(
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        showDragHandle: true,
        dragHandleColor: colorScheme.onSurfaceVariant.withOpacity(0.4),
      ),

      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
      ),

      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),

      searchBarTheme: SearchBarThemeData(
        elevation: WidgetStateProperty.all(0),
        backgroundColor:
            WidgetStateProperty.all(colorScheme.surfaceContainerHighest),
        shape: WidgetStateProperty.all(
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        ),
      ),
    );
  }
}
