import { Component } from "react";

/**
 * جلوگیری از «صفحه‌ی سفید»: اگر کامپوننتی هنگام رندر خطا بدهد،
 * به‌جای از بین رفتن کل سایت، یک پیام و دکمه‌ی تلاش مجدد نمایش داده می‌شود.
 * با تغییر resetKey (مثلاً مسیر صفحه) خودکار پاک می‌شود.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary:", error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" style={{ padding: "120px 16px", textAlign: "center" }}>
        <h2>مشکلی در نمایش این صفحه پیش آمد</h2>
        <p>لطفاً دوباره تلاش کنید.</p>
        <button type="button" onClick={() => window.location.reload()}>
          بارگذاری مجدد
        </button>
      </div>
    );
  }
}
