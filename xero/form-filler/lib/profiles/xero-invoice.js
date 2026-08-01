/**
 * Xero invoice / bill profile — aliases for common invoice fields.
 * Selector hints are soft preferences; discovery still works without them.
 */
(function (global) {
  const ns = (global.XeroFormFiller = global.XeroFormFiller || {});
  const profiles = (ns.profiles = ns.profiles || {});

  profiles["xero-invoice"] = {
    id: "xero-invoice",
    name: "Xero Invoice / Bill",
    hostPatterns: [/xero\.com$/i, /\.xero\.com$/i, /localhost/i, /127\.0\.0\.1/],
    aliases: {
      contact_name: [
        "contact",
        "customer",
        "customer_name",
        "client",
        "client_name",
        "bill_to",
        "to",
        "supplier",
        "vendor",
        "vendor_name",
      ],
      email: ["contact_email", "customer_email", "e_mail"],
      invoice_number: [
        "invoice_no",
        "invoice_num",
        "inv_number",
        "inv_no",
        "inv",
        "number",
        "invoice",
      ],
      reference: ["ref", "your_reference", "customer_reference", "memo"],
      purchase_order: ["po", "po_number", "po_no", "purchase_order_number", "order_number"],
      invoice_date: ["date", "issue_date", "inv_date", "bill_date", "created"],
      due_date: ["due", "payment_due", "pay_by"],
      currency: ["curr", "ccy"],
      description: [
        "item",
        "item_description",
        "line_description",
        "product",
        "service",
        "details",
      ],
      quantity: ["qty", "qty_ordered", "units"],
      unit_price: ["price", "rate", "unit_cost", "cost"],
      amount: ["line_amount", "line_total", "extended"],
      tax: ["tax_amount", "gst", "vat", "sales_tax"],
      subtotal: ["sub_total", "net", "net_total"],
      total: ["total_amount", "amount_due", "grand_total", "balance_due"],
      notes: ["note", "comment", "comments", "message"],
      account_code: ["account", "gl_code", "chart_of_accounts"],
    },
    selectors: {
      // Soft hints — demo form + typical name/id patterns
      contact_name: ['[name*="contact" i]', "#contact", "#contactName", '[aria-label*="Contact" i]'],
      invoice_number: ['[name*="invoice" i]', "#invoiceNumber", '[aria-label*="Invoice number" i]'],
      reference: ['[name*="reference" i]', "#reference"],
      invoice_date: ['[name*="date" i]:not([name*="due" i])', "#invoiceDate", 'input[type="date"]'],
      due_date: ['[name*="due" i]', "#dueDate"],
      description: ['[name*="description" i]', "#description", "textarea"],
      quantity: ['[name*="quantity" i]', '[name*="qty" i]', "#quantity"],
      unit_price: ['[name*="price" i]', '[name*="rate" i]', "#unitPrice"],
      total: ['[name*="total" i]', "#total"],
    },
  };
})(globalThis);
