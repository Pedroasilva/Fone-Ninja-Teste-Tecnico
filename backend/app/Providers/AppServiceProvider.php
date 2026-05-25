<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Contracts\ProdutoRepositoryInterface;
use App\Repositories\Contracts\CompraRepositoryInterface;
use App\Repositories\Contracts\VendaRepositoryInterface;
use App\Repositories\ProdutoRepository;
use App\Repositories\CompraRepository;
use App\Repositories\VendaRepository;
use App\Services\Contracts\ProdutoServiceInterface;
use App\Services\Contracts\CompraServiceInterface;
use App\Services\Contracts\VendaServiceInterface;
use App\Services\ProdutoService;
use App\Services\CompraService;
use App\Services\VendaService;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(ProdutoRepositoryInterface::class, ProdutoRepository::class);
        $this->app->bind(CompraRepositoryInterface::class,  CompraRepository::class);
        $this->app->bind(VendaRepositoryInterface::class,   VendaRepository::class);

        $this->app->bind(ProdutoServiceInterface::class, ProdutoService::class);
        $this->app->bind(CompraServiceInterface::class,  CompraService::class);
        $this->app->bind(VendaServiceInterface::class,   VendaService::class);
    }

    public function boot(): void {}
}
