import Swal, { type SweetAlertOptions } from "sweetalert2"

// Base config yang selalu pakai CSS variable dinamis
const baseStyle: SweetAlertOptions = {
  background: "hsl(var(--card-bg))",
  color: "hsl(var(--card-fg))",
  buttonsStyling: false,
  customClass: {
    backdrop: "swal2-backdrop-custom",
  }
}

export const showAlert = {
  success: (title: string, text: string) => {
    return Swal.fire({
      ...baseStyle,
      title,
      text,
      icon: "success",
      confirmButtonText: "Tutup",
      timer: 2000,
      timerProgressBar: true,
      customClass: {
        ...baseStyle.customClass,
        popup: "swal-popup-custom",
        confirmButton: "swal-btn-primary",
      }
    })
  },

  error: (title: string, text: string) => {
    return Swal.fire({
      ...baseStyle,
      title,
      text,
      icon: "error",
      confirmButtonText: "Coba Lagi",
      customClass: {
        ...baseStyle.customClass,
        popup: "swal-popup-custom",
        confirmButton: "swal-btn-destructive",
      }
    })
  },

  confirm: (title: string, text: string, confirmText = "Ya, Lanjutkan", cancelText = "Batal") => {
    return Swal.fire({
      ...baseStyle,
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      customClass: {
        ...baseStyle.customClass,
        popup: "swal-popup-custom",
        actions: "swal-actions-row",
        confirmButton: "swal-btn-destructive",
        cancelButton: "swal-btn-cancel",
      }
    })
  }
}
