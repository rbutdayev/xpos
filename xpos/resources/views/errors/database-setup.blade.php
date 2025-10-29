<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $message ?? 'Sistem hazırlanır' }} - xPOS</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="mb-6">
            <div class="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ $message ?? 'Sistem hazırlanır' }}</h1>
            <p class="text-gray-600 leading-relaxed">{{ $description ?? 'Məlumat bazası yenilənir. Zəhmət olmasa bir neçə dəqiqə gözləyin.' }}</p>
        </div>
        
        <div class="space-y-4">
            <div class="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Sistem yenilənir...</span>
            </div>
            
            <button onclick="window.location.reload()" 
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                Yenidən cəhd et
            </button>
            
            <div class="pt-4 border-t border-gray-200">
                <p class="text-xs text-gray-500">
                    Problem davam edərsə, administratorla əlaqə saxlayın.
                </p>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>