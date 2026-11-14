# Переименовывает все классы в буквы (a, b, c)
-repackageclasses ''
-allowaccessmodification
-optimizationpasses 5

# Удаляет логи (антивирусы их не любят)
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}
