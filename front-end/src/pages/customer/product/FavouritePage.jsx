import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {DeleteSweep} from "@mui/icons-material";
import {addToCart, getFavourites, removeFavourite} from "../../../api/bookApi.js";
import {useCart} from "../../../contexts/CartContext.jsx";
import ProductCard from "../../../components/wishlist/ProductCard.jsx";
import WishlistEmptyState from "../../../components/wishlist/WishlistEmptyState.jsx";
import toast from "react-hot-toast";

const FAVOURITE_ITEMS_PER_PAGE = 5;

const FavouritePage = () => {
    const REMOVE_EXIT_DURATION = 260;
    const [favourite, setFavourite] = useState([]);
    const [removingIds, setRemovingIds] = useState(new Set());
    const [exitingIds, setExitingIds] = useState(new Set());
    const [addingIds, setAddingIds] = useState(new Set());
    const [isRemovingAll, setIsRemovingAll] = useState(false);
    // === REFACTOR START: favourite pagination state (5 items/page) ===
    const [listPage, setListPage] = useState(0);
    const pageCount = Math.max(1, Math.ceil(favourite.length / FAVOURITE_ITEMS_PER_PAGE));
    // === REFACTOR END: favourite pagination state (5 items/page) ===
    const navigate = useNavigate();
    const {refreshCart} = useCart();

    useEffect(() => {
        document.title = "BookStore-FavouritePage";
        getFavourites().then(data => {
            setFavourite(data?.content || []);
        });
    }, []);

    // === REFACTOR START: clamp current page when favourite list changes ===
    useEffect(() => {
        if (favourite.length === 0) {
            setListPage(0);
            return;
        }
        const maxPage = Math.max(0, Math.ceil(favourite.length / FAVOURITE_ITEMS_PER_PAGE) - 1);
        setListPage(prev => (prev > maxPage ? maxPage : prev));
    }, [favourite.length]);

    const pagedFavourites = useMemo(() => {
        const start = listPage * FAVOURITE_ITEMS_PER_PAGE;
        return favourite.slice(start, start + FAVOURITE_ITEMS_PER_PAGE);
    }, [favourite, listPage]);
    // === REFACTOR END: clamp current page when favourite list changes ===

    // === REFACTOR START: robust favourite removal (single item + rollback) ===
    const handleRemoveFavouriteClick = async (event, bookId) => {
        event.preventDefault();
        event.stopPropagation();

        if (!bookId || removingIds.has(bookId)) return;

        const removeIndex = favourite.findIndex(item => item.id === bookId);
        const removedItem = favourite[removeIndex];
        if (!removedItem) return;

        setRemovingIds(prev => new Set(prev).add(bookId));
        setExitingIds(prev => new Set(prev).add(bookId));

        const timeoutId = window.setTimeout(() => {
            setFavourite(prev => prev.filter(item => item.id !== bookId));
        }, REMOVE_EXIT_DURATION);

        try {
            await removeFavourite(bookId);
            toast.success("Removed from wishlist");
        } catch (err) {
            window.clearTimeout(timeoutId);
            setFavourite(prev => {
                if (prev.some(item => item.id === bookId)) return prev;
                const next = [...prev];
                next.splice(Math.min(removeIndex, next.length), 0, removedItem);
                return next;
            });
            setExitingIds(prev => {
                const next = new Set(prev);
                next.delete(bookId);
                return next;
            });
            if (err?.response?.status === 401) {
                navigate("/bookseller/login");
                return;
            }
            console.error("Remove favourite failed:", err);
            toast.error("Failed to remove from wishlist");
        } finally {
            setRemovingIds(prev => {
                const next = new Set(prev);
                next.delete(bookId);
                return next;
            });
        }
    };
    // === REFACTOR END: robust favourite removal (single item + rollback) ===

    // === REFACTOR START: add-to-cart parity with Home product card behavior ===
    const handleAddToCartClick = async (event, item) => {
        event.preventDefault();
        event.stopPropagation();

        if (!item?.id || !item.inStock || addingIds.has(item.id)) return;

        setAddingIds(prev => new Set(prev).add(item.id));
        try {
            await addToCart(item.id, 1);
            await refreshCart();
            toast.success("Added to cart successfully");
        } catch (err) {
            if (err?.response?.status === 401) {
                navigate("/bookseller/login");
                return;
            }
            console.error("Add to cart failed:", err);
            toast.error("Failed to add to cart");
        } finally {
            setAddingIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };
    // === REFACTOR END: add-to-cart parity with Home product card behavior ===

    // === REFACTOR START: robust favourite removal (remove all) ===
    const handleRemoveAllClick = async () => {
        if (!favourite.length || isRemovingAll) return;

        setIsRemovingAll(true);
        const ids = favourite.map(item => item.id).filter(Boolean);
        setExitingIds(new Set(ids));

        try {
            const results = await Promise.allSettled(ids.map(bookId => removeFavourite(bookId)));
            const removedIds = new Set();

            results.forEach((result, index) => {
                if (result.status === "fulfilled") {
                    removedIds.add(ids[index]);
                }
            });

            setFavourite(prev => prev.filter(item => !removedIds.has(item.id)));
            if (removedIds.size !== ids.length) {
                toast.error("Some wishlist items could not be removed");
                setExitingIds(prev => {
                    const next = new Set(prev);
                    ids.forEach(id => {
                        if (!removedIds.has(id)) {
                            next.delete(id);
                        }
                    });
                    return next;
                });
            } else {
                toast.success("Removed all wishlist items");
            }
        } catch (err) {
            console.error("Remove all favourites failed:", err);
            setExitingIds(new Set());
            toast.error("Failed to remove wishlist items");
        } finally {
            setRemovingIds(new Set());
            setIsRemovingAll(false);
        }
    };
    // === REFACTOR END: robust favourite removal (remove all) ===

    const navigateToBrowse = () => {
        navigate("/bookseller/allbook");
    };

    return (
        <>
            {/* === REFACTOR START: inlined WishlistPage UI into FavouritePage for easier backup === */}
            <main className="wishlist-page">
            <div className="wishlist-shell">
                <header className="wishlist-header">
                    {favourite.length > 0 && (
                        <button
                            type="button"
                            className="wishlist-remove-all"
                            onClick={handleRemoveAllClick}
                            disabled={isRemovingAll}
                        >
                            <DeleteSweep fontSize="small"/>
                            {isRemovingAll ? "Removing..." : "Remove all"}
                        </button>
                    )}
                </header>

                {favourite.length > 0 ? (
                    <>
                    <section id="wishlistGrid" className="wishlist-grid" aria-label="Favourite books">
                        {pagedFavourites.map(item => (
                            <ProductCard
                                key={item.id}
                                item={item}
                                isRemoving={removingIds.has(item.id) || isRemovingAll}
                                isExiting={exitingIds.has(item.id)}
                                isAdding={addingIds.has(item.id)}
                                onRemove={handleRemoveFavouriteClick}
                                onAddToCart={handleAddToCartClick}
                            />
                        ))}
                    </section>

                    {/* === REFACTOR START: pagination actions for favourite list === */}
                    {favourite.length > FAVOURITE_ITEMS_PER_PAGE ? (
                        <nav className="wishlist-pagination" aria-label="Phan trang danh sach yeu thich">
                            <button
                                type="button"
                                className="wishlist-pagination__btn"
                                onClick={() => setListPage(prev => Math.max(0, prev - 1))}
                                disabled={listPage <= 0}
                            >
                                Previous
                            </button>
                            <span className="wishlist-pagination__info">
                                Page {listPage + 1} / {pageCount}
                            </span>
                            <button
                                type="button"
                                className="wishlist-pagination__btn"
                                onClick={() => setListPage(prev => Math.min(pageCount - 1, prev + 1))}
                                disabled={listPage >= pageCount - 1}
                            >
                                Next
                            </button>
                        </nav>
                    ) : null}
                    {/* === REFACTOR END: pagination actions for favourite list === */}
                    </>
                ) : (
                    <WishlistEmptyState onBrowse={navigateToBrowse}/>
                )}
            </div>
            </main>
            {/* === REFACTOR END: inlined WishlistPage UI into FavouritePage === */}
        </>
    );
};

export default FavouritePage;