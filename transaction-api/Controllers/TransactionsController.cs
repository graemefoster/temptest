using Microsoft.AspNetCore.Mvc;

namespace transaction_api.Controllers
{
    public class TransactionSearchRequest
    {
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public string AccountId { get; set; }
        public string CustomerId { get; set; }
        public string TransactionType { get; set; }
        public decimal? AmountLowLimit { get; set; }
        public decimal? AmountHighLimit { get; set; }
    }

    [ApiController]
    [Route("[controller]")]
    public class TransactionsController : ControllerBase
    {

        public class Transaction
        {
            public string Id { get; set; }
            public string CustomerId { get; set; }
            public string AccountId { get; set; }
            public DateTime Date { get; set; }
            public string Description { get; set; }
            public string TransactionType { get; set; }
            public decimal Amount { get; set; }
        }

        private static List<Transaction> SeedGraemeFosterLife()
        {
            var transactions = new List<Transaction>();
            var customerId = "graeme-foster";
            var accountId = "main-checking";
            var random = new Random(42); // deterministic
            var startDate = DateTime.Today.AddYears(-3);
            var endDate = DateTime.Today;
            int txnId = 1;
            var pubs = new[] { "The Red Lion", "The Crown", "The Fox" };
            var breakfastPlaces = new[] { "McDonalds", "Red Rooster" };
            var lunchPlaces = new[] { "Coles", "Woolworths" };
            var petrolStations = new[] { "Shell", "BP", "Caltex" };
            for (var date = startDate; date < endDate; date = date.AddDays(1))
            {
                // Weekly pay
                if (date.DayOfWeek == DayOfWeek.Thursday)
                {
                    var pay = random.Next(400, 601);
                    transactions.Add(new Transaction
                    {
                        Id = $"txn{txnId++}",
                        CustomerId = customerId,
                        AccountId = accountId,
                        Date = date.AddHours(9),
                        Description = "Factory Pay",
                        TransactionType = "Credit",
                        Amount = pay
                    });
                }
                // Breakfast most mornings
                if (random.NextDouble() < 0.85)
                {
                    var place = breakfastPlaces[random.Next(breakfastPlaces.Length)];
                    transactions.Add(new Transaction
                    {
                        Id = $"txn{txnId++}",
                        CustomerId = customerId,
                        AccountId = accountId,
                        Date = date.AddHours(7 + random.NextDouble()),
                        Description = $"Breakfast at {place}",
                        TransactionType = "Debit",
                        Amount = Math.Round((decimal)(7 + random.NextDouble() * 3), 2)
                    });
                }
                // Lunch 3 out of 7 days
                if (random.Next(7) < 3)
                {
                    var place = lunchPlaces[random.Next(lunchPlaces.Length)];
                    transactions.Add(new Transaction
                    {
                        Id = $"txn{txnId++}",
                        CustomerId = customerId,
                        AccountId = accountId,
                        Date = date.AddHours(12 + random.NextDouble()),
                        Description = $"Lunch groceries at {place}",
                        TransactionType = "Debit",
                        Amount = Math.Round((decimal)(10 + random.NextDouble() * 10), 2)
                    });
                }
                // AFL every other Saturday
                if (date.DayOfWeek == DayOfWeek.Saturday && ((date - startDate).Days / 7) % 2 == 0)
                {
                    transactions.Add(new Transaction
                    {
                        Id = $"txn{txnId++}",
                        CustomerId = customerId,
                        AccountId = accountId,
                        Date = date.AddHours(18),
                        Description = "AFL Ticket",
                        TransactionType = "Debit",
                        Amount = 40
                    });
                }
                // Petrol once a week, random day, 5-8pm
                if (date.DayOfWeek == (DayOfWeek)random.Next(7))
                {
                    var station = petrolStations[random.Next(petrolStations.Length)];
                    var hour = 17 + random.Next(4);
                    var amount = random.Next(70, 91);
                    transactions.Add(new Transaction
                    {
                        Id = $"txn{txnId++}",
                        CustomerId = customerId,
                        AccountId = accountId,
                        Date = date.AddHours(hour + random.NextDouble()),
                        Description = $"Petrol at {station}",
                        TransactionType = "Debit",
                        Amount = amount
                    });
                }
                // Pub 4 evenings a week, 3 pubs, 4 drinks
                if (random.Next(7) < 4)
                {
                    var pub = pubs[random.Next(pubs.Length)];
                    for (int d = 0; d < 4; d++)
                    {
                        var drinkAmount = Math.Round((decimal)(9 + random.NextDouble() * 4), 2);
                        transactions.Add(new Transaction
                        {
                            Id = $"txn{txnId++}",
                            CustomerId = customerId,
                            AccountId = accountId,
                            Date = date.AddHours(19 + d + random.NextDouble()),
                            Description = $"Drink at {pub}",
                            TransactionType = "Debit",
                            Amount = drinkAmount
                        });
                    }
                }
                // Bills (monthly, on 5th)
                if (date.Day == 5)
                {
                    var bills = new[] { "Electricity", "Water", "Council Tax", "Gas", "House Insurance" };
                    foreach (var bill in bills)
                    {
                        transactions.Add(new Transaction
                        {
                            Id = $"txn{txnId++}",
                            CustomerId = customerId,
                            AccountId = accountId,
                            Date = date.AddHours(10 + random.NextDouble()),
                            Description = $"{bill} Bill",
                            TransactionType = "Debit",
                            Amount = Math.Round((decimal)(100 + random.NextDouble() * 200), 2)
                        });
                    }
                }
                // Mortgage on first Thursday of month
                if (date.DayOfWeek == DayOfWeek.Thursday && date.Day <= 7)
                {
                    transactions.Add(new Transaction
                    {
                        Id = $"txn{txnId++}",
                        CustomerId = customerId,
                        AccountId = accountId,
                        Date = date.AddHours(8),
                        Description = "Mortgage Payment",
                        TransactionType = "Debit",
                        Amount = 1700
                    });
                }
            }
            return transactions;
        }

        [HttpPost("search")]
        public IActionResult Search([FromBody] TransactionSearchRequest request)
        {
            var allTransactions = SeedGraemeFosterLife();
            var results = allTransactions;

            if (request.DateFrom.HasValue)
                results = results.FindAll(t => t.Date >= request.DateFrom.Value);
            if (request.DateTo.HasValue)
                results = results.FindAll(t => t.Date <= request.DateTo.Value);
            if (!string.IsNullOrWhiteSpace(request.AccountId))
                results = results.FindAll(t => t.AccountId == request.AccountId);
            if (!string.IsNullOrWhiteSpace(request.CustomerId))
                results = results.FindAll(t => t.CustomerId == request.CustomerId);
            if (!string.IsNullOrWhiteSpace(request.TransactionType))
                results = results.FindAll(t => t.TransactionType.Equals(request.TransactionType, StringComparison.OrdinalIgnoreCase));
            if (request.AmountLowLimit.HasValue)
                results = results.FindAll(t => t.Amount >= request.AmountLowLimit.Value);
            if (request.AmountHighLimit.HasValue)
                results = results.FindAll(t => t.Amount <= request.AmountHighLimit.Value);

            return Ok(results);
        }
    }
}