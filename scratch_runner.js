const fs = require('fs');
const content = `<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

echo "PROFILES:" . PHP_EOL;
foreach (App\\Models\\Profil::all() as $p) {
    echo "  - ID={$p->id}, Code={$p->code}, Nom={$p->nom}, System={$p->is_system}" . PHP_EOL;
    $perms = $p->permissions ?? [];
    echo "    Permissions count: " . count($perms) . PHP_EOL;
}

echo PHP_EOL . "ANIMATEURS:" . PHP_EOL;
foreach (App\\Models\\Animateur::all() as $a) {
    echo "  - ID={$a->id}, Nom={$a->nom} {$a->prenoms}, UUID={$a->uuid}" . PHP_EOL;
    $affs = $a->affectations;
    echo "    Affectations: " . $affs->count() . PHP_EOL;
    foreach ($affs as $aff) {
        echo "      * Classe ID={$aff->classe_id}, Role={$aff->role_animateur}" . PHP_EOL;
    }
}
`;
fs.writeFileSync('C:/xampp/htdocs/catheo/scratch_test.php', content, 'utf8');
