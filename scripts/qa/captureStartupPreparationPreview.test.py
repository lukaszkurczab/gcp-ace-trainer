import importlib.util
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('capture',Path(__file__).with_name('captureStartupPreparationPreview.py'))
capture=importlib.util.module_from_spec(spec);spec.loader.exec_module(capture)
class NativeFitTest(unittest.TestCase):
    def test_complete_labels_and_targets_required(self):
        window={'height':874,'width':402};insets={'bottom':34}
        node=lambda label,bounds:{'attributes':{'accessibilityText':label,'bounds':bounds}}
        tree={'children':[node('description','[20,80][382,200]'),node('action','[20,240][382,300]')]}
        self.assertTrue(capture.content_fits_native_viewport(tree,['description','action'],window,insets))
        self.assertFalse(capture.content_fits_native_viewport(tree,['description','missing action'],window,insets))
        tree['children'][1]=node('action','[20,800][382,864]')
        self.assertFalse(capture.content_fits_native_viewport(tree,['description','action'],window,insets))
        tree['children'][1]=node('action','[0,0][402,874]')
        self.assertFalse(capture.content_fits_native_viewport(tree,['description','action'],window,insets))
    def test_expected_copy_uses_all_seven_real_dictionaries(self):
        for locale in ['pl','en','de','fr','es','it','et']:
            for scene in capture.SCENES:
                texts=capture.expected_texts(scene,locale,Path.cwd())
                self.assertTrue(texts);self.assertTrue(all(isinstance(text,str) and text for text in texts))
if __name__=='__main__':unittest.main()
