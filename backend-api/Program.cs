using Azure.AI.OpenAI;
using Azure.Identity;
using Microsoft.Extensions.AI;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddControllers();

// Register Azure OpenAI chat completions with DefaultAzureCredential
builder.Services.AddChatClient(_ => new AzureOpenAIClient(
        new Uri("https://33e3o743ddigy-aoai.openai.azure.com/"),
        new DefaultAzureCredential())
    .GetChatClient("gpt-4.1")
    .AsIChatClient());

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.MapControllers();
app.Run();