export function fixPrice(price: string): number {
    // Remove the dollar sign and any non-numeric characters except the decimal point
    const cleanedPrice = price.replace(/[^0-9.]/g, '');

    // Convert the cleaned string to a number
    const numericPrice = parseFloat(cleanedPrice);

    // Return the numeric price, ensuring it's a valid number
    if (isNaN(numericPrice)) {
        throw new Error('Invalid price format');
    }

    return numericPrice;
}


export function convertToLinkString(value: string) {
    return value
        .toLowerCase()               // Convert to lowercase
        .replace(/\s+/g, '-')         // Replace spaces with hyphens
        .replace(/[^a-z0-9\-]/g, '')  // Remove special characters except hyphens
        .replace(/-+/g, '-')          // Replace multiple hyphens with a single one
        .replace(/^-|-$/g, '');       // Remove hyphens from start or end if any
}
