<?php

namespace App\Http\Resources;

use App\Services\RentalPhotoService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RentalResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rental_number' => $this->rental_number,

            // Customer & Branch
            'customer_id' => $this->customer_id,
            'customer' => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'phone' => $this->customer->phone,
                'email' => $this->customer->email,
            ],
            'branch_id' => $this->branch_id,
            'branch' => [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
            ],

            // Dates
            'rental_start_date' => $this->rental_start_date?->format('Y-m-d'),
            'rental_end_date' => $this->rental_end_date?->format('Y-m-d'),
            'actual_return_date' => $this->actual_return_date?->format('Y-m-d'),
            'days_rented' => $this->days_rented,
            'days_overdue' => $this->days_overdue,
            'is_overdue' => $this->isOverdue(),
            'is_due_today' => $this->isDueToday(),

            // Financial
            'rental_price' => (float) $this->rental_price,
            'deposit_amount' => (float) $this->deposit_amount,
            'late_fee' => (float) $this->late_fee,
            'damage_fee' => (float) $this->damage_fee,
            'total_cost' => (float) $this->total_cost,
            'paid_amount' => (float) $this->paid_amount,
            'credit_amount' => (float) $this->credit_amount,
            'remaining_balance' => (float) $this->remaining_balance,

            // Status
            'status' => $this->status,
            'status_label' => $this->getStatusLabel(),
            'payment_status' => $this->payment_status,
            'payment_status_label' => $this->getPaymentStatusLabel(),

            // Collateral
            'collateral_type' => $this->collateral_type,
            'collateral_type_label' => $this->getCollateralTypeLabel(),
            'collateral_amount' => $this->collateral_amount ? (float) $this->collateral_amount : null,
            'collateral_document_type' => $this->collateral_document_type,
            'collateral_document_number' => $this->collateral_document_number,
            'collateral_photo_path' => app(RentalPhotoService::class)->getPhotoUrl($this->collateral_photo_path),
            'collateral_notes' => $this->collateral_notes,
            'collateral_returned' => $this->collateral_returned,
            'collateral_returned_at' => $this->collateral_returned_at?->format('Y-m-d H:i:s'),

            // Items
            'items' => $this->when(
                $this->relationLoaded('items'),
                RentalItemResource::collection($this->items)->resolve()
            ) ?: [],
            'items_count' => $this->whenLoaded('items', fn() => $this->items->count(), 0),

            // Agreement
            'has_agreement' => $this->relationLoaded('agreement') && $this->agreement !== null,
            'agreement' => $this->when(
                $this->relationLoaded('agreement') && $this->agreement !== null,
                fn() => (new RentalAgreementResource($this->agreement))->resolve()
            ),

            // Payments
            'payments' => $this->when(
                $this->relationLoaded('payments'),
                fn() => $this->payments->map(fn($payment) => [
                    'payment_id' => $payment->id,
                    'amount' => (float) $payment->amount,
                    'method' => $payment->method,
                    'notes' => $payment->notes,
                    'created_at' => $payment->created_at?->format('Y-m-d H:i:s'),
                ])->toArray()
            ) ?: [],

            // Notes
            'notes' => $this->notes,
            'internal_notes' => $this->when($request->user()?->role === 'admin', $this->internal_notes),

            // Notifications
            'sms_sent' => $this->sms_sent,
            'telegram_sent' => $this->telegram_sent,
            'reminder_sent' => $this->reminder_sent,
            'overdue_alert_sent' => $this->overdue_alert_sent,

            // Timestamps
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get status label in Azerbaijani
     */
    protected function getStatusLabel(): string
    {
        return match($this->status) {
            'reserved' => 'Rezerv edilib',
            'active' => 'Aktiv',
            'returned' => 'Qaytarılıb',
            'overdue' => 'Gecikmiş',
            'cancelled' => 'Ləğv edilib',
            default => $this->status,
        };
    }

    /**
     * Get payment status label in Azerbaijani
     */
    protected function getPaymentStatusLabel(): string
    {
        return match($this->payment_status) {
            'paid' => 'Ödənilib',
            'credit' => 'Borclu',
            'partial' => 'Qismən ödənilib',
            default => $this->payment_status,
        };
    }

    /**
     * Get collateral type label in Azerbaijani
     */
    protected function getCollateralTypeLabel(): string
    {
        return match($this->collateral_type) {
            'deposit_cash' => 'Nağd depozit',
            'passport' => 'Pasport',
            'id_card' => 'Şəxsiyyət vəsiqəsi',
            'drivers_license' => 'Sürücülük vəsiqəsi',
            'other_document' => 'Digər sənəd',
            default => $this->collateral_type,
        };
    }
}
