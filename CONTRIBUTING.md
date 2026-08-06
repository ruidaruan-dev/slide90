# Contributing

Thank you for helping make executive presentation generation more useful and less generic.

## Good contributions

- a layout pattern tested on a real management question;
- a synthetic before/after example;
- a platform installer or adapter;
- a validation rule that catches a real failure;
- a bilingual writing or typography improvement;
- an evaluation case with clear expected behavior.

## Privacy requirement

Do not contribute:

- internal or customer decks;
- watermarked screenshots;
- confidential metrics, names, logos, or templates;
- material copied from a consulting firm or paid template library;
- examples without permission to publish.

Use synthetic data and neutral brands.

## Development

```bash
python scripts/validate_repo.py
python -m unittest discover -s tests
python scripts/package_skill.py
```

## Pull requests

1. Keep one change per pull request.
2. Explain the management problem the change solves.
3. Add or update an evaluation case.
4. Include a rendered synthetic example for visual changes.
5. Confirm that validation passes.

By contributing, you agree that your contribution is licensed under Apache License 2.0.
