import { type KeyboardEvent } from "react";

export class InputKeys {
  static document = (e: KeyboardEvent<HTMLInputElement> & KeyboardEvent<HTMLTextAreaElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-Z0-9]/g, "");
  };

  static code = (e: KeyboardEvent<HTMLInputElement> & KeyboardEvent<HTMLTextAreaElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-Z0-9-_.]/g, "");
  };

  static name = (e: KeyboardEvent<HTMLInputElement> & KeyboardEvent<HTMLTextAreaElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚ ]/g, "");
  };

  static abbreviation = (e: KeyboardEvent<HTMLInputElement> & KeyboardEvent<HTMLTextAreaElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚ. ]/g, "");
  };

  static alphanumeric = (e: KeyboardEvent<HTMLInputElement> & KeyboardEvent<HTMLTextAreaElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^a-z0-9A-ZñÑáéíóúÁÉÍÓÚ.\-_\s]/g, "");
  };

  static integer = (e: KeyboardEvent<HTMLInputElement> & KeyboardEvent<HTMLTextAreaElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
  };

  static decimal = (decimals: number = 2) => {
    return (e: KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const cursorPosition = input.selectionStart || 0;

      let value = input.value.replace(/[^0-9.,]/g, "");
      value = value.replace(/,/g, ".");

      const parts = value.split(".");

      if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("");
      }

      const [integerPart, decimalPart] = value.split(".");
      if (decimalPart !== undefined) {
        value = integerPart + "." + decimalPart.slice(0, decimals);
      }

      input.value = value;
      input.setSelectionRange(Math.min(cursorPosition, value.length), Math.min(cursorPosition, value.length));
    };
  };

  static address = (e: KeyboardEvent<HTMLInputElement> & KeyboardEvent<HTMLTextAreaElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-Z0-9ñáéíóúÁÉÍÓÚ.\-_\s]/g, "");
  };

  static phone = (e: KeyboardEvent<HTMLInputElement> & KeyboardEvent<HTMLTextAreaElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9-)(+ ]/g, "");
  };

  static email = (e: KeyboardEvent<HTMLInputElement> & KeyboardEvent<HTMLTextAreaElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^a-z0-9_@.]/g, "");
  };

  static time24 = (e: KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    let value = input.value.replace(/[^0-9]/g, ""); // Solo números

    if (value.length === 0) {
      input.value = "";
      return;
    }

    // Validar primer dígito de hora (0-2)
    if (value.length >= 1) {
      const firstDigit = parseInt(value[0]);
      if (firstDigit > 2) {
        value = "2";
      }
    }

    // Validar segundo dígito de hora según el primero
    if (value.length >= 2) {
      const firstDigit = parseInt(value[0]);
      const secondDigit = parseInt(value[1]);

      // Si la primera cifra es 2, la segunda debe ser 0-3
      if (firstDigit === 2 && secondDigit > 3) {
        value = value[0] + "3";
      }
      // Si la primera cifra es 0 o 1, la segunda puede ser 0-9 (ya está bien)
    }

    // Validar primer dígito de minutos (0-5)
    if (value.length >= 3) {
      const thirdDigit = parseInt(value[2]);
      if (thirdDigit > 5) {
        value = value.substring(0, 2) + "5";
      }
    }

    // Formatear con dos puntos
    if (value.length >= 3) {
      const hours = value.substring(0, 2);
      const minutes = value.substring(2, 4);
      value = hours + ":" + minutes;
    }

    input.value = value;
  };
}
