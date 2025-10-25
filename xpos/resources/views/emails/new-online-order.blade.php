@component('mail::message')
# Yeni Online Sifariş

Salam! Yeni online sifariş daxil olub.

## Sifariş məlumatları

**Sifariş nömrəsi:** {{ $sale->sale_number }}
**Tarix:** {{ $sale->created_at->format('d.m.Y H:i') }}

## Müştəri məlumatları

**Ad:** {{ $sale->customer_name }}
**Telefon:** {{ $sale->customer_phone }}

@if($sale->notes)
**Qeyd:** {{ $sale->notes }}
@endif

## Sifariş edilən məhsullar

@foreach($sale->items as $item)
- **{{ $item->product->name }}**
  @if($item->variant)
  ({{ $item->variant->size }} {{ $item->variant->color }})
  @endif
  <br>
  Miqdar: {{ $item->quantity }} x {{ number_format($item->price, 2) }} ₼ = {{ number_format($item->total, 2) }} ₼
@endforeach

---

**Cəm məbləğ:** {{ number_format($sale->total, 2) }} ₼

## Növbəti addımlar

1. Müştəri ilə əlaqə saxlayın: **{{ $sale->customer_phone }}**
2. Sifarişi təsdiq edin
3. Ödəniş və çatdırılma təfərrüatlarını müzakirə edin

@component('mail::button', ['url' => config('app.url') . '/sales'])
Sifarişləri idarə et
@endcomponent

Təşəkkürlər,<br>
{{ config('app.name') }}
@endcomponent
