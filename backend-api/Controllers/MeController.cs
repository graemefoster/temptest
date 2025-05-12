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
    }
}
