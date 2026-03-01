String.prototype.firstName = function (): string {
    const fullName = this.toString().trim();

    if (!fullName) return "";

    const nameParts = fullName.split(/\s+/);
    return nameParts[0] || "";
};

String.prototype.firstLetter = function (): string {
    const str = this.toString().trim();
    if (!str) return "";
    return str.charAt(0).toUpperCase();
};
