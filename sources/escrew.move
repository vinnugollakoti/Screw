module escrew::simple_escrew {

    use sui::coin::{Self, Coin};
    use sui::balance::Balance;
    use sui::clock::{Self, Clock};

    public struct Escrew<phantom T> has key {
        id: UID,
        buyer: address,
        seller: address,
        balance: Balance<T>,
        cancel_request: bool,
        cancel_approved: bool,
        created_at: u64,
        timeout_ms: u64
    }

    public fun create_escrew<T: store>(
        seller: address,
        coin: Coin<T>,
        clock: &Clock,
        timeout_ms: u64,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);
        let balance = coin::into_balance<T>(coin);

        let escrew = Escrew<T> {
            id: object::new(ctx),
            buyer,
            seller,
            balance,
            cancel_request: false,
            cancel_approved: false,
            created_at: clock::timestamp_ms(clock),
            timeout_ms
        };

        transfer::share_object(escrew);
    }

    public fun release_escrew<T: store>(
        escrew: Escrew<T>,
        ctx: &mut TxContext
    ) {
        let Escrew { id, buyer, seller, balance, cancel_request, cancel_approved, created_at, timeout_ms } = escrew;
        let sender = tx_context::sender(ctx);

        assert!(sender == buyer, 404);

        object::delete(id);

        let coin = coin::from_balance<T>(balance, ctx);
        transfer::public_transfer(coin, seller);
    }


    public fun refund<T: store>(
        escrew: Escrew<T>,
        clock : &Clock,
        ctx: &mut TxContext
    ) {
        let Escrew {id, buyer, seller, balance, cancel_request, cancel_approved, created_at, timeout_ms} = escrew;

        let now = clock::timestamp_ms(clock);


        assert!((cancel_request && cancel_approved) || (cancel_request && now >= created_at + timeout_ms), 500);

        object::delete(id);

        let coin = coin::from_balance<T>(balance, ctx);
        transfer::public_transfer(coin, buyer);
    }

    // buyer request cancellation
    public fun request_cancel<T: store> (
        escrew: &mut Escrew<T>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(sender==escrew.buyer, 404);
        
        escrew.cancel_request = true;
    }

    public fun approve_cancel<T: store> (
        escrew: &mut Escrew<T>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(sender == escrew.seller, 404);
        assert!(escrew.cancel_request, 500);

        escrew.cancel_approved = true;
    }
}