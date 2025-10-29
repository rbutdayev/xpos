<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $message ?? 'Bağlantı problemi' }} - xPOS</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gradient-to-br from-red-50 to-orange-100 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="mb-6">
            <div class="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ $message ?? 'Bağlantı problemi' }}</h1>
            <p class="text-gray-600 leading-relaxed">{{ $description ?? 'Məlumat bazası ilə əlaqə yaradıla bilmədi. Administratorla əlaqə saxlayın.' }}</p>
        </div>
        
        <div class="space-y-4">
            <button onclick="window.location.reload()" 
                    class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200">
                Yenidən cəhd et
            </button>
            
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="font-medium text-gray-900 mb-2">Təklif edilən addımlar:</h3>
                <ul class="text-sm text-gray-600 space-y-1 text-left">
                    <li>• İnternet bağlantınızı yoxlayın</li>
                    <li>• Bir neçə dəqiqə gözləyib yenidən cəhd edin</li>
                    <li>• Problem davam edərsə, administratorla əlaqə saxlayın</li>
                </ul>
            </div>
            
            <div class="pt-4 border-t border-gray-200">
                <p class="text-xs text-gray-500">
                    Texniki dəstək üçün: IT departamenti
                </p>
            </div>
        </div>
    </div>
</body>
</html>