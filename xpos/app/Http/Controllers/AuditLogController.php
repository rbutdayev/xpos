<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('account.access');
    }

    public function index(Request $request)
    {
        Gate::authorize('view-reports');

        $query = AuditLog::with(['user', 'account'])
            ->where('account_id', auth()->user()->account_id)
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $request->validate(['search' => 'required|string|max:255']);
            $validated = $request->validated();
            $searchTerm = $validated['search'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('action', 'like', '%' . $searchTerm . '%')
                  ->orWhere('description', 'like', '%' . $searchTerm . '%')
                  ->orWhere('model_type', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('user', function ($subQ) use ($searchTerm) {
                      $subQ->where('name', 'like', '%' . $searchTerm . '%');
                  });
            });
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('model_type')) {
            $request->validate(['model_type' => 'required|string|max:255']);
            $validated = $request->validated();
            $query->where('model_type', 'like', '%' . $validated['model_type'] . '%');
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $auditLogs = $query->paginate(20)->withQueryString();

        $users = User::where('account_id', auth()->user()->account_id)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        $actions = AuditLog::where('account_id', auth()->user()->account_id)
            ->select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        $modelTypes = AuditLog::where('account_id', auth()->user()->account_id)
            ->select('model_type')
            ->distinct()
            ->orderBy('model_type')
            ->pluck('model_type');

        return Inertia::render('AuditLogs/Index', [
            'auditLogs' => $auditLogs,
            'users' => $users,
            'actions' => $actions,
            'modelTypes' => $modelTypes,
            'filters' => $request->only([
                'search', 'action', 'model_type', 'user_id', 'date_from', 'date_to'
            ]),
        ]);
    }

    public function show(AuditLog $auditLog)
    {
        Gate::authorize('view-reports');
        
        if ($auditLog->account_id !== auth()->user()->account_id) {
            abort(403);
        }

        $auditLog->load(['user', 'account']);

        return Inertia::render('AuditLogs/Show', [
            'auditLog' => $auditLog,
        ]);
    }
}
