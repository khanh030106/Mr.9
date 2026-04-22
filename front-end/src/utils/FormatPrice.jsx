export const formatPrice = (price) => {
    // --- BEGIN FIX: giá 0 không bị coi là falsy — revert: if (!price) return "0" ---
    if (price === null || price === undefined) return "0";
    const n = Number(price);
    if (Number.isNaN(n)) return "0";
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    // --- END FIX: giá 0 ---
};