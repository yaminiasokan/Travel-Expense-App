from django.db import migrations

DEFAULT_CATEGORIES = [
    ("Food", "utensils"),
    ("Hotel", "bed"),
    ("Fuel", "fuel"),
    ("Flight", "plane"),
    ("Train", "train-front"),
    ("Bus", "bus"),
    ("Taxi", "car-taxi-front"),
    ("Shopping", "shopping-bag"),
    ("Medical", "stethoscope"),
    ("Entertainment", "ticket"),
    ("Miscellaneous", "more-horizontal"),
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model("expenses", "Category")
    for name, icon in DEFAULT_CATEGORIES:
        Category.objects.get_or_create(name=name, defaults={"icon": icon, "is_default": True})


def remove_categories(apps, schema_editor):
    Category = apps.get_model("expenses", "Category")
    Category.objects.filter(name__in=[n for n, _ in DEFAULT_CATEGORIES], is_default=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("expenses", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_categories, remove_categories),
    ]
