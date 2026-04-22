const WishlistEmptyState = ({onBrowse}) => {
    return (
        <div id="wishlistEmptyState" className="wishlist-empty">
            <div className="wishlist-empty__icon" aria-hidden="true">♡</div>
            <h3>No favourite books yet</h3>
            <p>Save books you love and come back anytime.</p>
            <button type="button" onClick={onBrowse}>Browse books</button>
        </div>
    );
};

export default WishlistEmptyState;

