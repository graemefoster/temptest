using System.ComponentModel;
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
        public string Name { get; set; }
        public string Category { get; set; } // Accounts, Payments, Transactions, Loans, General
        public string? Url { get; set; }
        public object? Arguments { get; set; }
    }

    [ApiController]
    [Route("suggest-menu-items")]
    public class SuggestMenuItemsController : ControllerBase
    {
        // Example static menu items with categories.
        private static readonly List<MenuItemWithCategory> MenuItems = new()
        {
            new MenuItemWithCategory { Name = "View Transactions", Category = "Transactions" },
            new MenuItemWithCategory { Name = "Make Payment to BSB and Account", Category = "Payments" },
            new MenuItemWithCategory { Name = "Make Payment to Mobile Number", Category = "Payments" },
            new MenuItemWithCategory { Name = "Make Payment to Email Address", Category = "Payments" },
            new MenuItemWithCategory { Name = "View Account Balance", Category = "Accounts" },
            new MenuItemWithCategory { Name = "Transfer Between My Accounts", Category = "Accounts" },
            new MenuItemWithCategory { Name = "View Statements", Category = "Accounts" },
            new MenuItemWithCategory { Name = "Manage Payees", Category = "Payments" },
            new MenuItemWithCategory { Name = "Set Up Scheduled Payment", Category = "Payments" },
            new MenuItemWithCategory { Name = "View Upcoming Payments", Category = "Payments" },
            new MenuItemWithCategory { Name = "Download Statement", Category = "Accounts" },
            new MenuItemWithCategory { Name = "Change Card PIN", Category = "Accounts" },
            new MenuItemWithCategory { Name = "Report Lost or Stolen Card", Category = "Accounts" },
            new MenuItemWithCategory { Name = "Activate New Card", Category = "Accounts" },
            new MenuItemWithCategory { Name = "View Card Details", Category = "Accounts" },
            new MenuItemWithCategory { Name = "Block Card Temporarily", Category = "Accounts" },
            new MenuItemWithCategory { Name = "Request New Cheque Book", Category = "Accounts" },
            new MenuItemWithCategory { Name = "Update Contact Details", Category = "General" },
            new MenuItemWithCategory { Name = "Open New Account", Category = "Accounts" },
            new MenuItemWithCategory { Name = "Apply for a Loan", Category = "Loans" }
        };

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

            var suggestions = MenuItems
                .Where(x => request.ActiveButton == "Top" || x.Category == request.ActiveButton)
                .Where(item => item.Name.Contains(request.Query, System.StringComparison.OrdinalIgnoreCase))
                .Take(5)
                .ToList();

            return Ok(suggestions);
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