<?php

declare(strict_types=1);


foreach ([
    'Auth',
    'PublicSite',
    'Employees',
    'WorkOrders',
    'Scheduling',
    'Clients',
    'Admin',
    'Company',
    'Billing',
] as $module) {
    $path = base_path('app/Modules/'.$module.'/Presentation/Routes/api.php');
    if (is_file($path)) {
        require $path;
    }
}