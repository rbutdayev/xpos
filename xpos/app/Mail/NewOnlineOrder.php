<?php

namespace App\Mail;

use App\Models\Sale;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewOnlineOrder extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Sale $sale)
    {
        $this->sale->load(['items.product', 'items.variant']);
    }

    public function build()
    {
        return $this->subject("Yeni Online Sifariş #{$this->sale->sale_number}")
            ->markdown('emails.new-online-order');
    }
}
