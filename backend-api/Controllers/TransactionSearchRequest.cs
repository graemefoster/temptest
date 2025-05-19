using System.ComponentModel;

namespace backend_api.Controllers;

public class TransactionSearchRequest
{
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? AccountId { get; set; }
    public string? CustomerId { get; set; }
    public string? MerchantName { get; set; }
    [Description("Credit or Debit")]public string? TransactionType { get; set; }
    public decimal? AmountLowLimit { get; set; }
    public decimal? AmountHighLimit { get; set; }
}