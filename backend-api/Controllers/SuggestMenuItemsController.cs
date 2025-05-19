using System.ComponentModel;
using Azure.Identity;
using Azure.Search.Documents;
using Azure.Search.Documents.Indexes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.AI;
using ChatMessage = Microsoft.Extensions.AI.ChatMessage;

namespace backend_api.Controllers
{
    public class MenuItem
    {
        public string Name { get; set; }
        public string? Url { get; set; }
        public object? Arguments { get; set; }
    }

    public class MenuItemWithCategory
    {
        [SimpleField(IsKey = true)] public string Id { get; set; }
        [SearchableField()] public string Name { get; set; }
        [SearchableField(IsFacetable = true, IsFilterable = true)] public string Category { get; set; } // Accounts, Payments, Transactions, Loans, General

        public string? Url { get; set; }
    }
    

    [ApiController]
    [Route("suggest-menu-items")]
    public class SuggestMenuItemsController : ControllerBase
    {

        public static readonly Dictionary<int, int> MenuItemHitCounts = new()
        {
            [1] = 1234,
            [2] = 54,
            [5] = 323,
            [6] = 123,
            [7] = 234,
            [8] = 1234,
            [9] = 54,
            [10] = 323,
            [11] = 123,
            [12] = 234,
            [13] = 1234,
            [14] = 54,
            [15] = 323,
            [16] = 123,
            [17] = 234,
            [18] = 1234,
            [19] = 54,
            [20] = 323
        };
        
        // Example static menu items with categories.
        public static readonly List<MenuItemWithCategory> MenuItems =
        [
            new MenuItemWithCategory { Id = "1", Name = "View Transactions", Category = "Transactions" },
            new MenuItemWithCategory { Id = "2", Name = "Make Payment to BSB and Account", Category = "Payments" },
            new MenuItemWithCategory { Id = "3", Name = "Make Payment to Mobile Number", Category = "Payments" },
            new MenuItemWithCategory { Id = "4", Name = "Make Payment to Email Address", Category = "Payments" },
            new MenuItemWithCategory { Id = "5", Name = "View Account Balance", Category = "Accounts" },
            new MenuItemWithCategory { Id = "6", Name = "Transfer Between My Accounts", Category = "Accounts" },
            new MenuItemWithCategory { Id = "7", Name = "View Statements", Category = "Accounts" },
            new MenuItemWithCategory { Id = "8", Name = "Manage Payees", Category = "Payments" },
            new MenuItemWithCategory { Id = "9", Name = "Set Up Scheduled Payment", Category = "Payments" },
            new MenuItemWithCategory { Id = "10", Name = "View Upcoming Payments", Category = "Payments" },
            new MenuItemWithCategory { Id = "11", Name = "Download Statement", Category = "Accounts" },
            new MenuItemWithCategory { Id = "12", Name = "Change Card PIN", Category = "Accounts" },
            new MenuItemWithCategory { Id = "13", Name = "Report Lost or Stolen Card", Category = "Accounts" },
            new MenuItemWithCategory { Id = "14", Name = "Activate New Card", Category = "Accounts" },
            new MenuItemWithCategory { Id = "15", Name = "View Card Details", Category = "Accounts" },
            new MenuItemWithCategory { Id = "16", Name = "Block Card Temporarily", Category = "Accounts" },
            new MenuItemWithCategory { Id = "17", Name = "Request New Cheque Book", Category = "Accounts" },
            new MenuItemWithCategory { Id = "18", Name = "Update Contact Details", Category = "General" },
            new MenuItemWithCategory { Id = "19", Name = "Open New Account", Category = "Accounts" },
            new MenuItemWithCategory { Id = "20", Name = "Apply for a Loan", Category = "Loans" }
        ];

        private readonly IChatClient _chatCompletionService;
        private readonly ILogger<SuggestMenuItemsController> _logger;

        public SuggestMenuItemsController(IChatClient chatCompletionService, ILogger<SuggestMenuItemsController> logger)
        {
            _chatCompletionService = chatCompletionService;
            _logger = logger;
        }

        [HttpPost]
        [Route("suggestions")]
        public async Task<IActionResult> GetSuggestions([FromBody] SuggestionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
                return Ok(Array.Empty<MenuItemWithCategory>());
            
            var searchClient = new SearchClient(new Uri("https://grfaisearchtest.search.windows.net"), "menu", new DefaultAzureCredential());
                
            var suggestionsResponse = await searchClient.SuggestAsync<MenuItemWithCategory>(request.Query, "sg", new SuggestOptions
            {
                UseFuzzyMatching = true,
                Filter = request.ActiveButton == "Top" ? null : SearchFilter.Create($"Category eq {request.ActiveButton}"),
                Select = { "Name", "Category", "Id" }
            });
            
            
            var suggestions = suggestionsResponse.Value.Results.ToArray();
            
            //order by hit count
            suggestions = suggestions.OrderByDescending(x => MenuItemHitCounts.GetValueOrDefault(int.Parse(x.Document.Id), 0)).ToArray();

            // var suggestions = MenuItems
            //     .Where(x => request.ActiveButton == "Top" || x.Category == request.ActiveButton)
            //     .Where(item => item.Name.Contains(request.Query, System.StringComparison.OrdinalIgnoreCase))
            //     .Take(5)
            //     .ToList();

            return Ok(suggestions.Select(x => x.Document).ToArray());
        }

        [HttpPost]
        [Route("ai-suggestions")]
        public async Task<IActionResult> GetAISuggestions([FromBody] SuggestionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Query))
                return Ok(new List<string>());

            _logger.LogInformation("Calling AI service for suggestions with query: {Query}", request.Query);

            var chatMessages = new List<ChatMessage>
            {
                new(ChatRole.System,
                    $$"""
                      You are a helpful banking assistant trying to help a customer to efficiently achieve a goal.
                      They are typing into a search-ahead box and you can help them by seeing if we have any services that we can call for them.

                      They also will have an active segment of the app which will help narrow down the options.

                      If they haven't entered enough input for you to make a decision then simply return 'no' as a single word.

                      Useful information:
                      Today's date / time / timezone is {{DateTimeOffset.Now:O}}.

                      Rules:
                      Only populate merchant names for ProNouns. Use canonical names for merchants like McDonalds, instead of Maccas.

                      Example:
                      User: How much did I spend at McDonalds yesterday?

                      Response for Transaction Search API:
                      ```
                      {
                          "DateFrom": "{{DateTime.Now.Date.AddDays(-1):O}}",
                          "DateTo": "{{DateTime.Now.Date:O}}",
                          "MerchantName": "McDonalds",
                          "TransactionType": "Debit"
                      }
                      ```

                      User: Did I paid my home loan this week?

                      Response for Transaction Search API:
                      ```
                      {
                          "DateFrom": "{{DateTime.Now.Date.AddDays(-7):O}}",
                          "DateTo": "{{DateTime.Now.Date:O}}",
                          "TransactionType": "Debit"
                      }
                      ```
                      """),
                new ChatMessage(ChatRole.User,
                    $"The user is looking for {request.Query} and the active segment is {request.ActiveButton}.")
            };

            var chatOptions = new ChatOptions()
            {
                Tools = [AIFunctionFactory.Create(CallTransactionSearchApiAsync)]
            };

            var result = await _chatCompletionService.GetResponseAsync(chatMessages, chatOptions);
            var completion = result.Text;

            if (completion == "no")
            {
                _logger.LogInformation("AI returned 'no' for suggestions.");
                return Ok(Array.Empty<MenuItem>());
            }

            var menuItems = new List<object>();

            // If the AI suggests a tool call, create a menu item instead of calling the tool
            foreach (var message in result.Messages)
            {
                foreach (var content in message.Contents)
                {
                    if (content is FunctionCallContent functionCall)
                    {
                        _logger.LogInformation("AI suggested a function call: {FunctionCall}", functionCall.Name);

                        if (functionCall.Name == "CallTransactionSearchApi")
                        {
                            return Ok(new[]
                            {
                                new MenuItem()
                                {
                                    Name = "Transaction Search",
                                    Url = "/",
                                    Arguments = functionCall.Arguments
                                }
                            });
                        }
                    }
                }
            }

            _logger.LogInformation("MenuItems suggested by AI: {MenuItems}", menuItems.Count);
            return Ok(new { menuItems });
        }

        private async Task<object> CallTransactionSearchApiAsync(
            [Description("Arguments to pass to the Transaction Search API")]
            TransactionSearchRequest request,
            [Description("A short descriptor of this call that could be shown in a menu on a Mobile applicationm")]
            string suggestedMenuItemName,
            CancellationToken cancellationToken = default)
        {
            using var httpClient = new HttpClient();
            var apiUrl = "http://localhost:5019/transactions/search";
            var response = await httpClient.PostAsJsonAsync(apiUrl, request, cancellationToken);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<object>(cancellationToken: cancellationToken);
            return result;
        }

        public class SuggestionRequest
        {
            public string Query { get; set; }
            public string ActiveButton { get; set; }
        }
    }
}