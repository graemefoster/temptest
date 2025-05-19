using Azure.Identity;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;
using Microsoft.AspNetCore.Mvc;

namespace backend_api.Controllers
{
    [ApiController]
    [Route("me")]
    public class MeController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetMe()
        {
            return Ok(new { name = "Graeme" });
        }

        [HttpGet("/setup")]
        public async Task<IActionResult> Setup()
        {
            //populate the AI Search index for suggestions 
            var searchIndexClient = new SearchIndexClient(new Uri("https://grfaisearchtest.search.windows.net"), new DefaultAzureCredential());

            FieldBuilder fieldBuilder = new FieldBuilder();
            var searchFields = fieldBuilder.Build(typeof(MenuItemWithCategory));

            var definition = new SearchIndex("menu", searchFields);

            var suggester = new SearchSuggester(
                "sg", "Name");
            
            definition.Suggesters.Add(suggester);

            if (await searchIndexClient.GetIndexAsync("menu") != null)
            {
                await searchIndexClient.DeleteIndexAsync("menu");
            }
            
            var index = await searchIndexClient.CreateOrUpdateIndexAsync(definition);

            var items = SuggestMenuItemsController.MenuItems;
            var searchClient = searchIndexClient.GetSearchClient("menu");
            await searchClient.UploadDocumentsAsync(items);
            
            return Ok(new { setup = true });
        }
    }
}